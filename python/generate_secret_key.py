#!/usr/bin/env python
"""
Generate a Django secret key for use in .env file
"""
from django.core.management.utils import get_random_secret_key

if __name__ == '__main__':
    secret_key = get_random_secret_key()
    print("Generated SECRET_KEY:")
    print(secret_key)
    print("\nAdd this to your .env file:")
    print(f"SECRET_KEY={secret_key}")

