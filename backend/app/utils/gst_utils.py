def mock_verify_gstin(gstin):
    if gstin == "29ABCDE1234F2Z5":
        return {
            "valid": True,
            "gstin": gstin,
            "trade_name": "Mock Trade Co.",
            "state": "Karnataka"
        }
    return {
        "valid": False,
        "error": "Invalid GSTIN"
    }
