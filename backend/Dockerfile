
# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
COPY . .

# Copy the source code (Binary Engine) from the parent directory
# We need to restructure slightly for Docker or set PYTHONPATH
# For simplicity, we assume the engine code is COPY'd or we adjust imports.
# In this workspace, src/core/engine.py is outside backend/.
# Strategy: We will copy the entire project context or adjust how build is done.
# BUT, for standard deployment, it's easier if we copy the necessary source files.
# Let's assume we build from root context or copy needed files.

# ADJUSTMENT: We will set PYTHONPATH to include /app/src if we copy src there.
COPY ../src /app/src

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable
ENV PORT=8000
ENV PYTHONPATH=/app

# Run app.py when the container launches
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
