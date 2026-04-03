from flask import Flask, request, jsonify
from transformers import BlipProcessor, BlipForConditionalGeneration
from transformers import CLIPProcessor, CLIPModel
from PIL import Image
import requests
from io import BytesIO

app = Flask(__name__)

# ===== BLIP =====
blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

def generate_caption(image):
    inputs = blip_processor(image, return_tensors="pt")
    out = blip_model.generate(**inputs)
    return blip_processor.decode(out[0], skip_special_tokens=True)

# ===== CLIP =====
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

labels = ["giày thể thao", "áo", "quần", "túi xách"]

def classify(image):
    inputs = clip_processor(text=labels, images=image, return_tensors="pt", padding=True)
    outputs = clip_model(**inputs)
    probs = outputs.logits_per_image.softmax(dim=1)
    return labels[probs.argmax()]

# ===== Extract =====
def extract_info(caption):
    data = {}

    caption_lower = caption.lower()

    if "sneaker" in caption_lower:
        data["category"] = "Giày thể thao"

    if "white" in caption_lower:
        data["color"] = "Trắng"

    if "high top" in caption_lower:
        data["attributes"] = ["cổ cao"]

    data["name"] = caption

    return data

# ===== API =====
@app.route('/predict', methods=['POST'])
def predict():
    image_url = request.json.get('image_url')

    # load ảnh từ URL
    response = requests.get(image_url)
    image = Image.open(BytesIO(response.content)).convert("RGB")

    caption = generate_caption(image)
    category = classify(image)
    data = extract_info(caption)

    data["category"] = category
    data["caption"] = caption

    return jsonify(data)

if __name__ == '__main__':
    app.run(port=5000)