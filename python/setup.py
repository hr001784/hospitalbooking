#!/usr/bin/env python
"""
Setup script for HMS project
Run this after installing dependencies to set up the database
"""
import os
import sys
import subprocess

def run_command(command):
    """Run a shell command"""
    print(f"Running: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    print(result.stdout)
    return True

def main():
    print("=" * 50)
    print("HMS Project Setup")
    print("=" * 50)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("\n⚠️  Warning: .env file not found!")
        print("Please create a .env file with your configuration.")
        print("See README.md for required environment variables.")
        response = input("\nContinue anyway? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)
    
    # Make migrations
    print("\n1. Creating migrations...")
    if not run_command("python manage.py makemigrations"):
        print("Failed to create migrations")
        sys.exit(1)
    
    # Run migrations
    print("\n2. Running migrations...")
    if not run_command("python manage.py migrate"):
        print("Failed to run migrations")
        sys.exit(1)
    
    # Create superuser prompt
    print("\n3. Create superuser?")
    response = input("Would you like to create a superuser now? (y/n): ")
    if response.lower() == 'y':
        run_command("python manage.py createsuperuser")
    
    print("\n" + "=" * 50)
    print("Setup complete!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Start the Django server: python manage.py runserver")
    print("2. Start the email service: cd serverless-email && npm start")
    print("3. Visit http://localhost:8000/admin/ to access the admin panel")

if __name__ == '__main__':
    main()

