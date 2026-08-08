from transformers import BlipProcessor, BlipForConditionalGeneration
from PIL import Image

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

image = Image.open("../images/squat.jpg")  # any image you have handy, food or not, just to confirm it runs

inputs = processor(image, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=30)
caption = processor.decode(output[0], skip_special_tokens=True)

print("Caption:", caption)