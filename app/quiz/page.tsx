import Image from "next/image";
import Navbar from "@/app/Navbar";
import FetchImage from "@/app/FetchImage";

export default function Home() {
  return (
    <div className="bg-black block min-h-screen">
      <Navbar />
      <div className="font-white py-30 px-20 w-400">
        <h1 className="my-3 text-6xl font-bold block">How bad is the case of the Dementia?</h1>
        <p className="text-2xl">One of the symptom of alzheimer is dementia. This website is made to help medical student learn the how bad is the case of dementia based on the photo of the brain MRI. It has two features, you can upload the image and the AI can predict which class of
          alzheimer it is Mild Demented, Moderate Demented, NonDemented, or Very Mild Demented or you can guess which MRI is which class.
        </p>
      </div>
      <div className="text-left block mx-20">
        <FetchImage />
      </div>
    </div>
    
  );
}
