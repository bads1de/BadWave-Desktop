import torch
from transformers import AutoProcessor, AutoModelForCTC
import sys

# 一旦 know model に戻してテスト
model_id = "facebook/wav2vec2-large-960h-lv60-self"
try:
    processor = AutoProcessor.from_pretrained(model_id)
    print("Processor loaded successfully")
except Exception as e:
    print(f"Error loading processor: {e}")

try:
    model = AutoModelForCTC.from_pretrained(model_id)
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
