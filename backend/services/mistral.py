import os
import base64
from dotenv import load_dotenv
from mistralai import Mistral
from PIL import Image
import numpy as np
from io import BytesIO

load_dotenv(".env.local")

api_key = os.getenv("MISTRAL_API_KEY")
client = Mistral(api_key=api_key)

def image_to_base64(img: Image.Image) -> str:
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return base64.b64encode(buffer.getvalue()).decode("utf-8")

def explanation_result_mistral(img_np, heatmap, predicted_class):
    brain_img = Image.fromarray(img_np.astype(np.uint8))
    heatmap_rgb = (np.stack([heatmap * 255]*3, axis=-1)).astype(np.uint8)
    heatmap_img = Image.fromarray(heatmap_rgb)

    brain_b64 = image_to_base64(brain_img)
    heatmap_b64 = image_to_base64(heatmap_img)

    prompt = f"""
    You are a medical AI assistant.

    Explain the dementia classification result in ONE single paragraph only.
    Classification Results:
    - Dementia Level: {predicted_class}

    I'm providing you with two images:
    1. The original brain MRI scan
    2. A Grad-CAM heatmap showing which regions the AI model focused on (red/yellow areas indicate high importance)

    Based on the provided brain scan and Grad-CAM heatmap, please explain:

    1. **Result Interpretation**: What does the classification "{predicted_class}" mean?
    2. **Affected Areas**: Based on the heatmap (red/yellow or other color regions), which brain regions show signs of dementia?
    3. **Medical Explanation**: Why are these areas important in dementia diagnosis? What happens to these brain regions?

    Provide the explanation in clear English that is easy to understand yet medically accurate.
    Don't use words like 'Certainly!' or stuff like that in your explanation.

    STRICT RULES:
    - Output must be exactly ONE paragraph.
    - Do NOT use headings, lists, bullet points, or line breaks.
    - Do NOT use markdown.
    - Use clear transitions using phrases such as:
    "The predicted class indicates that...",
    "Based on the Grad-CAM heatmap...",
    "From a medical perspective...",
    "Overall,..."
    - Keep the explanation concise, professional, and medically accurate.

    The paragraph must include:
    1) Meaning of the predicted dementia stage
    2) Interpretation of the Grad-CAM heatmap
    3) Medical relevance of the affected brain regions
    4) A brief overall conclusion
    """

    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": f"data:image/png;base64,{brain_b64}"
                    },
                    {
                        "type": "image_url",
                        "image_url": f"data:image/png;base64,{heatmap_b64}"
                    }
                ]
            }
        ]
    )

    return response.choices[0].message.content
