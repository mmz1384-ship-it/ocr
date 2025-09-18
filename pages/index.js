import { useState } from "react";

export default function Home(){
  const [file,setFile] = useState(null);
  const [result,setResult] = useState(null);

  const upload = async ()=>{
    if(!file) return;
    const formData = new FormData();
    formData.append("file",file);
    const res = await fetch("/api/parse",{method:"POST",body:formData});
    if(res.ok){
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResult(url);
    }else{
      alert("خطا در پردازش فایل");
    }
  }

  return <div style={{padding:20}}>
    <h2>آپلود فاکتور یا رسید (PDF/JPG/PNG/WEBP)</h2>
    <input type="file" accept=".pdf,.jpg,.png,.webp" onChange={e=>setFile(e.target.files[0])}/>
    <button onClick={upload} style={{marginTop:10}}>پردازش و دریافت خروجی ZIP</button>
    {result && <a href={result} target="_blank">دانلود ZIP</a>}
  </div>
}