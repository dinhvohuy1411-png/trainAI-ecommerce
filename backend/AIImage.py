import transformers.dynamic_module_utils
transformers.dynamic_module_utils.check_imports = lambda *args, **kwargs: []

from flask import Flask, request, jsonify
from transformers import AutoProcessor, AutoModelForCausalLM
from PIL import Image
import requests
import base64
from io import BytesIO
import re

app = Flask(__name__)

# ===== FLORENCE-2 (MÔ HÌNH THẾ HỆ MỚI) =====
print("Đang tải mô hình Florence-2...")
model_id = "microsoft/Florence-2-base"
processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(model_id, trust_remote_code=True).eval()
print("Tải thành công! Server đã sẵn sàng ở cổng 7860.")

def generate_detailed_description(image):
    prompt = "<MORE_DETAILED_CAPTION>"
    inputs = processor(text=prompt, images=image, return_tensors="pt")
    
    generated_ids = model.generate(
      input_ids=inputs["input_ids"],
      pixel_values=inputs["pixel_values"],
      max_new_tokens=1024,
      do_sample=False,
      num_beams=3
    )
    
    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
    parsed_answer = processor.post_process_generation(
        generated_text, task=prompt, image_size=(image.width, image.height)
    )
    return parsed_answer[prompt]

def extract_info(caption):
    data = {}
    caption_lower = caption.lower()

    # 1. Nhận diện MÀU SẮC
    color_map = {
        "black": "Đen", "white": "Trắng", "red": "Đỏ", 
        "blue": "Xanh dương", "green": "Xanh lá", "yellow": "Vàng", 
        "pink": "Hồng", "gray": "Xám", "brown": "Nâu"
    }
    color = ""
    for eng, vn in color_map.items():
        if eng in caption_lower:
            color = vn
            break 

    # 2. Nhận diện THƯƠNG HIỆU
    brands = ["nike", "adidas", "puma", "gucci", "chanel", "vans", "converse", "zara", "balenciaga"]
    brand_name = ""
    for b in brands:
        if b in caption_lower:
            brand_name = b.capitalize()
            break

    # 3. Nhận diện DANH MỤC & KÍCH THƯỚC (SIZE)
    category = "Thời trang"
    sizes = ""
    if "shoe" in caption_lower or "sneaker" in caption_lower: 
        category = "Giày thể thao"
        sizes = "39, 40, 41, 42"
    elif "shirt" in caption_lower or "jacket" in caption_lower or "sweater" in caption_lower: 
        category = "Thời trang"
        sizes = "S, M, L, XL"
    elif "pants" in caption_lower or "jeans" in caption_lower: 
        category = "Thời trang"
        sizes = "29, 30, 31, 32"
    elif "bag" in caption_lower or "backpack" in caption_lower or "watch" in caption_lower: 
        category = "Phụ kiện"

    # 4. Nhận diện CHẤT LIỆU
    material_map = {"leather": "Da", "cotton": "Cotton", "denim": "Denim", "canvas": "Vải Canvas"}
    material_name = ""
    for eng, vn in material_map.items():
        if eng in caption_lower:
            material_name = vn
            break

    # 5. GIÁ ĐỀ XUẤT
    suggested_price = 150000 
    if category == "Giày thể thao": suggested_price = 350000
    if brand_name: suggested_price *= 3
    if material_name == "Da": suggested_price = int(suggested_price * 1.5)

    # 6. GỘP TÊN SẢN PHẨM
    product_type = "Áo"
    if category == "Giày thể thao": product_type = "Giày thể thao"
    elif "pants" in caption_lower or "jeans" in caption_lower: product_type = "Quần"
    elif category == "Phụ kiện": product_type = "Phụ kiện"

    product_name = product_type
    if brand_name: product_name += f" {brand_name}"
    if material_name: product_name += f" {material_name.lower()}"
    if color: product_name += f" màu {color.lower()}"

    data["name"] = product_name
    data["category"] = category
    data["color"] = color
    data["material"] = material_name
    data["sizes"] = sizes
    data["suggested_price"] = suggested_price
    return data

# ===== API =====
@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    if not data or 'image_url' not in data:
        return jsonify({"error": "Không tìm thấy URL ảnh"}), 400
        
    image_url = data['image_url']
    image = None

    try:
        # Hỗ trợ ảnh Base64
        if image_url.startswith('data:image'):
            base64_data = re.sub('^data:image/.+;base64,', '', image_url)
            image_bytes = base64.b64decode(base64_data)
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
        # Hỗ trợ Link Web (vượt tường lửa)
        else:
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36'}
            response = requests.get(image_url, headers=headers, stream=True, timeout=15)
            response.raise_for_status() 
            image = Image.open(response.raw).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Lỗi tải ảnh: {str(e)}"}), 400

    # Chạy Florence-2
    detailed_caption = generate_detailed_description(image)
    extracted_data = extract_info(detailed_caption)

    print(f"\n[AI Đã đọc]: {detailed_caption}")
    return jsonify(extracted_data)

if __name__ == '__main__':
    # QUAN TRỌNG NHẤT LÀ DÒNG NÀY (Sửa lỗi cURL 7)
    app.run(host='0.0.0.0', port=7860)