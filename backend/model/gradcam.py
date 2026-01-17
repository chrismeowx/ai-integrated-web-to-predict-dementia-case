import torch
from timm import create_model
from torchvision import transforms
import cv2
import numpy as np
from PIL import Image
import base64

class_names = [
    "Mild Demented",
    "Moderately Demented",
    "Non Demented",
    "Very Mild Demented"
]

model = create_model("swin_tiny_patch4_window7_224", pretrained=False, num_classes=4)
model.load_state_dict(torch.load("damodel.pth", map_location="cpu"))
model.eval()

def get_swin_target_layer(model):
    return model.layers[-1].blocks[-1].norm2

class SwinGradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer

        self.activations = None
        self.gradients = None

        self.fwd_hook = target_layer.register_forward_hook(self.save_activation)
        self.bwd_hook = target_layer.register_full_backward_hook(self.save_gradient)

    def save_activation(self, module, inp, output):
        self.activations = output

    def save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def __call__(self, x):
        output = self.model(x)
        pred = output.argmax(dim=1)

        self.model.zero_grad()
        output[0, pred].backward()

        acts = self.activations
        grads = self.gradients

        weights = grads.mean(dim=1)
        cam = (acts * weights.unsqueeze(1)).sum(dim=-1)

        spatial = int(np.sqrt(cam.shape[1]))
        cam = cam.reshape(1, spatial, spatial)

        cam = torch.relu(cam)
        cam = cam.squeeze().detach().numpy()

        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min == 0:
            cam = np.zeros_like(cam)
        else:
            cam = (cam - cam_min) / (cam_max - cam_min)

        return cam, pred.item()


target_layer = get_swin_target_layer(model)
cam_generator = SwinGradCAM(model, target_layer)

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406], [0.229,0.224,0.225])
])

def preprocess_image(content):
    img = Image.open(content).convert("RGB")
    img_np = np.array(img)
    t = transform(img).unsqueeze(0)
    return img_np, t


def generate_gradcam_base64(img_np, heatmap):
    h, w = img_np.shape[:2]

    cam = cv2.resize(heatmap, (w, h))
    cam_uint8 = np.uint8(255 * cam)
    cam_color = cv2.applyColorMap(cam_uint8, cv2.COLORMAP_JET)

    overlay = 0.4 * cam_color + 0.6 * img_np
    overlay = np.uint8(overlay)

    _, buffer = cv2.imencode(".png", overlay)
    return base64.b64encode(buffer).decode("utf-8")

def predict_image_with_gradcam(image: Image.Image):
    img_np = np.array(image.convert("RGB"))
    x = transform(image).unsqueeze(0)

    heatmap, pred_idx = cam_generator(x)

    predicted_class = class_names[pred_idx]

    return predicted_class, heatmap, img_np

