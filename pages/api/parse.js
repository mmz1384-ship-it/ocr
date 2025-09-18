import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import { createWorker } from "tesseract.js";
import { parsePersianInvoice } from "../../lib/parser";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import archiver from "archiver";

export const config = { api: { bodyParser: false } };

async function pdfToImages(filePath) {
  const data = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(data);
  const pages = pdfDoc.getPages();
  const images = [];
  for(let i=0;i<pages.length;i++){
    const pngPath = filePath.replace(/\.pdf$/i, `_page${i+1}.png`);
    // تولید یک تصویر placeholder با sharp (صفحه سفید)
    const width = 1000, height = 1400;
    await sharp({
      create:{
        width,
        height,
        channels:3,
        background:{r:255,g:255,b:255}
      }
    }).png().toFile(pngPath);
    images.push(pngPath);
  }
  return images;
}

async function preprocessImage(filePath){
  const imgBuf = fs.readFileSync(filePath);
  let buffer = await sharp(imgBuf)
    .rotate()
    .resize({ width:1500, withoutEnlargement:true })
    .greyscale()
    .normalize()
    .toBuffer();
  return buffer;
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).send("Method not allowed");
  const form = new IncomingForm();
  form.parse(req, async (err,fields,files)=>{
    if(err) return res.status(500).send(err.message);
    const f = files.file;
    const savedPath = path.join("./tmp", f.originalFilename);
    fs.mkdirSync("./tmp",{recursive:true});
    fs.writeFileSync(savedPath, fs.readFileSync(f.filepath));
    let images = [];
    if(savedPath.toLowerCase().endsWith(".pdf")){
      images = await pdfToImages(savedPath);
    }else{
      images = [savedPath];
    }

    const worker = createWorker({logger:m=>{}});
    await worker.load();
    await worker.loadLanguage('fas+eng');
    await worker.initialize('fas+eng');
    let fullText = "";
    for(const img of images){
      const pre = await preprocessImage(img);
      const { data } = await worker.recognize(pre);
      fullText += "\n"+(data.text||"");
    }
    await worker.terminate();

    const parsed = parsePersianInvoice(fullText);
    const zipName = "./tmp/output_"+Date.now()+".zip";
    const outputStream = fs.createWriteStream(zipName);
    const archive = archiver('zip',{zlib:{level:9}});
    archive.pipe(outputStream);
    archive.append(fs.createReadStream(savedPath),{name:f.originalFilename});
    archive.append(JSON.stringify({parsed,extracted_text:fullText},null,2),{name:"data.json"});
    await archive.finalize();
    outputStream.on("close",()=>{
      const data = fs.readFileSync(zipName);
      res.setHeader("Content-Type","application/zip");
      res.setHeader("Content-Disposition",'attachment; filename="invoice_output.zip"');
      res.send(data);
    });
  });
}