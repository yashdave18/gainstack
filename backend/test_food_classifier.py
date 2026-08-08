from food_classifier_service import predict_food

with open("../images/test.jpg", "rb") as f:  # any image for now, doesn't need to be food yet to confirm it runs
    image_bytes = f.read()

result = predict_food(image_bytes)
print(result)