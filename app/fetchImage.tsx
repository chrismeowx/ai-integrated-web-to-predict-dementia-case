'use client';

import React, { useEffect, useState } from 'react';

interface MRIItem {
  file: string;
  label: string;
}

const classes = ["Mild Demented", "Moderately Demented", "Non Demented", "Very Mild Demented"];

const FetchImage: React.FC = () => {
  const [data, setData] = useState<MRIItem[]>([]);
  const [current, setCurrent] = useState<MRIItem | null>(null);

  const [feedback, setFeedback] = useState<string>("");
  const [gradcam, setGradcam] = useState<string>("");
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetch('/mri/label.json')
      .then(res => res.json())
      .then((json: MRIItem[]) => {
        setData(json);
        pickRandom(json);
      })
      .catch(err => console.error(err));
  }, []);

  const pickRandom = (arr: MRIItem[] = data) => {
    if (arr.length === 0) return;
    const idx = Math.floor(Math.random() * arr.length);
    setCurrent(arr[idx]);
    setFeedback("");
    setGradcam("");
    setExplanation("");
    setError("");
  };

  const requestExplanation = async () => {
    if (!current) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/quiz-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_path: current.file,
          true_label: current.label,
          model: "gemini"
        }),
      });

      if (!res.ok) throw new Error("Backend error");

      const result = await res.json();
      setGradcam(result.gradcam);
      setExplanation(result.explanation);

    } catch (err) {
      console.error(err);
      setError("Failed to load explanation. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = (choice: string) => {
    if (!current) return;

    if (choice === current.label) {
      setFeedback("Correct!");
      new Audio("/sound/check.mp3").play();
    } else {
      setFeedback(`Wrong! Correct answer: ${current.label}`);
      new Audio("/sound/buzzer.mp3").play();
    }

    requestExplanation();
  };

  return (
    <div className="text-white flex flex-col items-center px-4">

      {current && (
        <div className="flex flex-col items-center">
          <img src={`/mri/${current.file}`} alt={current.label} className="w-100 rounded-xl shadow-lg" />
          <button onClick={() => pickRandom()} className="mt-4 bg-blue-500 hover:bg-blue-600 w-80 px-6 py-2 rounded">Show Random MRI</button>
        </div>
      )}

      <h2 className="text-2xl font-semibold mt-10 text-center max-w-xl">Which Dementia stage does this MRI represent?</h2>

      <div className="grid grid-cols-2 gap-4 mt-6 w-full">
        {classes.map(cls => (
          <button key={cls} onClick={() => checkAnswer(cls)} className="bg-white text-black h-[60px] rounded hover:bg-blue-200 transition">{cls}</button>
        ))}
      </div>

      {feedback && (
        <div className="mt-6 p-4 bg-gray-900 border border-gray-700 rounded w-full text-center">
          <p className="font-semibold">{feedback}</p>
        </div>
      )}

      {loading && (
        <div className="mt-50 mb-50 p-6 border border-blue-500 bg-blue-900/20 rounded w-full max-w-xl text-center">
          <p className="text-blue-300 font-semibold">
            Loading explanation & Grad-CAM...
          </p>
        </div>
      )}

      {error && (
        <div className="mt-8 p-6 border border-red-500 bg-red-900/20 rounded w-full max-w-xl text-center">
          <p className="text-red-400 font-semibold">
            {error}
          </p>
        </div>
      )}

      {(gradcam || explanation) && (
        <div className="mt-30 mb-30 p-10 border border-gray-700 bg-gray-900 rounded-xl w-full w-full text-center">
          <h3 className="text-2xl font-semibold mb-10">
            Explanation by Gemini
          </h3>

          {gradcam && (
            <div className="mb-8 flex justify-center">
              <img
                src={`data:image/png;base64,${gradcam}`}
                alt="Grad-CAM"
                className="rounded-xl border w-96 border-gray-700"
              />
            </div>
          )}

          {explanation && (
            <div>
              <p className="text-justify text-xl leading-relaxed whitespace-pre-line text-left">{explanation}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default FetchImage;
