import React from 'react'

export default function PredictAI() {
  return (
    <div>
      <div className="font-white block w-300 my-50 mx-20">
        <h1 className="text-4xl font-bold">Predict</h1>
        <div className="">
          <label className="mt-[10px] px-4 py-2 bg-white text-black cursor-pointer rounded inline-block">
          Upload Image
          <input type="file" className="hidden" />
        </label>
        </div>
      </div>
    </div>
  )
}
