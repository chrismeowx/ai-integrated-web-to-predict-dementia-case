"use client";

import Image from "next/image";
import Navbar from "@/app/Navbar";
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);

  const [result, setResult] = useState("");
  const [gradcam, setGradcam] = useState(null);

  const [imgNp, setImgNp] = useState(null);
  const [heatmap, setHeatmap] = useState(null);

  const [aiChoice, setAiChoice] = useState("gemini");
  const [explanations, setExplanations] = useState({});

  const handleFileChange = async (e) => {
    const img = e.target.files[0];
    if (!img) return;

    setFile(img);
    setPreview(URL.createObjectURL(img));

    setPredicting(true);
    setResult("");
    setGradcam(null);
    setExplanations({});
    setImgNp(null);
    setHeatmap(null);

    const formData = new FormData();
    formData.append("file", img);

    try {
      const res = await axios.post(
        "http://localhost:8000/guess",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setResult(res.data.predicted_class);
      setGradcam(res.data.gradcam);
      setImgNp(res.data.img_np);
      setHeatmap(res.data.heatmap);

    } catch (err) {
      console.error(err);
      alert("Error predicting image");
    }

    setPredicting(false);
  };

  const requestExplanation = async () => {
    if (!imgNp || !heatmap) return;

    setLoading(true);
    setExplanations({});

    try {
      const res = await axios.post("http://localhost:8000/explain", {
        model: aiChoice,
        predicted_class: result,
        img_np: imgNp,
        heatmap: heatmap
      });

      setExplanations(res.data);

    } catch (err) {
      console.error(err);
      alert("Error generating explanation");
    }

    setLoading(false);
  };

  return (
    <div className="bg-black min-h-screen text-white px-20 py-20">
      <Navbar />

      <div className="mt-10 mb-5">
        <h1 className="my-3 text-6xl font-bold">Guess with AI</h1>
        <p className="text-2xl w-400">You can upload a brain MRI image and the system will predict the dementia level of the uploaded image. It predicts by using a model Swin Transformer trained by Brain MRI dataset with four labels. After predicting, it will generates a Grad-CAM heatmap, and explains the result using Gemini or Mistral, or you can use both of you want to compare the explanation by the two LLMs!</p>
      </div>

      {!gradcam && (
        <div>
          {preview && (
            <Image src={preview} alt="Uploaded" width={350} height={350} className="border border-gray-600"
            />
          )}

          {predicting && (
            <p className="mt-5 text-xl animate-pulse text-gray-300">
              Processing image...
            </p>
          )}

          {!predicting && (
            <label className="mt-10 inline-block p-5 w-[200px] text-center rounded-lg cursor-pointer text-black bg-white hover:bg-gray-300">
              Upload Image
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>
      )}

      {gradcam && (
        <div className="mt-10 p-10 w-full border border-gray-700 bg-gray-900">

          <div className="mb-10">
            <h2 className="font-semibold text-3xl mb-5">Grad-CAM Heatmap</h2>
            <Image src={`data:image/png;base64,${gradcam}`} alt="GradCAM" width={350} height={350} className="rounded-lg border border-white" />
          </div>

          <h3 className="font-semibold text-3xl mb-8">
            Prediction: <span className="text-white">{result}</span>
          </h3>

          <div className="flex gap-4 mb-8">
            {["gemini", "mistral", "both"].map((m) => (
              <button key={m} onClick={() => setAiChoice(m)} className={`px-6 py-3 rounded-lg border ${aiChoice === m ? "bg-white text-black" : "bg-black text-white"}`}>
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <button onClick={requestExplanation} disabled={loading} className="px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-300">
            {loading ? "Generating explanation..." : "Generate Explanation"}
          </button>

          {Object.keys(explanations).length > 0 && (
            <div className="mt-12 space-y-10 w-full">

              {explanations.gemini && (
                <div className="p-8 border border-gray-600 rounded-lg">
                  <h4 className="text-4xl font-semibold mb-4">Gemini</h4>
                  <p className="text-2xl leading-relaxed whitespace-pre-line">
                    {explanations.gemini}
                  </p>
                </div>
              )}

              {explanations.mistral && (
                <div className="p-8 border border-gray-600 rounded-lg">
                  <h4 className="text-4xl font-semibold mb-4">Mistral</h4>
                  <p className="text-2xl leading-relaxed whitespace-pre-line">
                    {explanations.mistral}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
