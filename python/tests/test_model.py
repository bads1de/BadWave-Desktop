import torch
from transformers import AutoProcessor, AutoModelForCTC
import sys

model_id = "facebook/mms-300m-1130-forced-aligner"
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
