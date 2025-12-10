import random

# Temporary store for mock OTPs (in-memory)
otp_store = {}

def send_mock_otp(phone):
    otp = str(random.randint(100000, 999999))
    otp_store[phone] = otp
    print(f"[MOCK] Sent OTP {otp} to {phone}")
    return otp

def verify_mock_otp(phone, entered_otp):
    return otp_store.get(phone) == entered_otp
