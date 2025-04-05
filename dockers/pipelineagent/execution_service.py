from fastapi import FastAPI, HTTPException, BackgroundTasks
import subprocess
import tempfile
import os
import json
import logging
import time
import shutil
from typing import Dict, Any, Optional
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/var/log/execution_service.log')
    ]
)
logger = logging.getLogger("execution_service")

app = FastAPI(title="Data Pipeline Execution Service")

# Define the request model
class PipelineRequest(BaseModel):
    pipelineId: str
    code: str
    options: Optional[Dict[str, Any]] = None

# Define result storage
PIPELINES_DIR = "/data/pipelines"
RESULTS_DIR = "/data/results"

for directory in [PIPELINES_DIR, RESULTS_DIR]:
    os.makedirs(directory, exist_ok=True)

@app.get("/")
async def root():
    return {"status": "running", "service": "Data Pipeline Execution Service"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/execute")
async def execute_code(request: PipelineRequest, background_tasks: BackgroundTasks):
    """
    Execute the submitted Python code in a controlled environment
    """
    logger.info(f"Received execution request for pipeline ID: {request.pipelineId}")
    
    # Create pipeline directory
    pipeline_dir = f"{PIPELINES_DIR}/{request.pipelineId}"
    os.makedirs(pipeline_dir, exist_ok=True)
    
    # Create a temporary file for the code
    with open(f"{pipeline_dir}/pipeline.py", "w") as f:
        f.write(request.code)
    
    logger.info(f"Saved code to {pipeline_dir}/pipeline.py")
    
    # Check options
    options = request.options or {}
    execute_now = options.get("executeNow", True)
    
    if execute_now:
        # Start execution in background task to prevent timeout
        background_tasks.add_task(execute_pipeline, request.pipelineId, f"{pipeline_dir}/pipeline.py")
    
    return {
        "success": True,
        "message": f"Pipeline execution {'started' if execute_now else 'saved'} for ID: {request.pipelineId}",
        "pipelineId": request.pipelineId,
        "status": "running" if execute_now else "saved"
    }

@app.get("/status/{pipeline_id}")
async def check_status(pipeline_id: str):
    """
    Check the status of a pipeline execution
    """
    status_file = f"{RESULTS_DIR}/{pipeline_id}_status.json"
    if not os.path.exists(status_file):
        return {
            "success": False,
            "message": f"No status information found for pipeline ID: {pipeline_id}",
            "status": "unknown"
        }
    
    with open(status_file, 'r') as f:
        status = json.load(f)
    
    return status

@app.post("/execute_cron/{pipeline_id}")
async def execute_cron_job(pipeline_id: str):
    """
    Execute a saved pipeline on demand
    """
    pipeline_path = f"{PIPELINES_DIR}/{pipeline_id}/pipeline.py"
    
    if not os.path.exists(pipeline_path):
        raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found")
    
    # Execute the pipeline in the background
    background_tasks = BackgroundTasks()
    background_tasks.add_task(execute_pipeline, pipeline_id, pipeline_path)
    
    return {
        "success": True,
        "message": f"Cron job execution started for pipeline ID: {pipeline_id}",
        "pipelineId": pipeline_id,
        "status": "running"
    }

async def execute_pipeline(pipeline_id: str, script_path: str):
    """
    Execute the pipeline code and store results
    """
    start_time = time.time()
    
    # Update status to running
    update_status(pipeline_id, "running", "Pipeline execution started")
    
    # Create results directory
    result_dir = f"{RESULTS_DIR}/{pipeline_id}"
    os.makedirs(result_dir, exist_ok=True)
    
    try:
        # Prepare environment variables for the subprocess
        env = os.environ.copy()
        env["PIPELINE_ID"] = pipeline_id
        env["RESULTS_DIR"] = result_dir
        env["PYTHONPATH"] = "/app:/app/utils"
        
        # Execute the code
        logger.info(f"Executing pipeline: {pipeline_id}")
        result = subprocess.run(
            ["python", script_path],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            env=env
        )
        
        execution_time = time.time() - start_time
        
        # Save stdout and stderr
        with open(f"{result_dir}/stdout.log", 'w') as f:
            f.write(result.stdout)
        
        with open(f"{result_dir}/stderr.log", 'w') as f:
            f.write(result.stderr)
        
        # Update status based on execution result
        if result.returncode == 0:
            update_status(
                pipeline_id, 
                "completed", 
                f"Pipeline executed successfully in {execution_time:.2f} seconds",
                stdout=result.stdout,
                execution_time=execution_time
            )
            logger.info(f"Pipeline {pipeline_id} completed successfully")
        else:
            update_status(
                pipeline_id, 
                "failed", 
                f"Pipeline execution failed with exit code {result.returncode}",
                stderr=result.stderr,
                execution_time=execution_time
            )
            logger.error(f"Pipeline {pipeline_id} failed with exit code {result.returncode}")
            
    except subprocess.TimeoutExpired:
        update_status(
            pipeline_id, 
            "timeout", 
            "Pipeline execution timed out after 5 minutes"
        )
        logger.error(f"Pipeline {pipeline_id} timed out")
    except Exception as e:
        update_status(
            pipeline_id, 
            "error", 
            f"Error executing pipeline: {str(e)}"
        )
        logger.exception(f"Error executing pipeline {pipeline_id}")

def update_status(pipeline_id: str, status: str, message: str, **kwargs):
    """
    Update the status file for a pipeline
    """
    status_data = {
        "pipelineId": pipeline_id,
        "status": status,
        "message": message,
        "timestamp": time.time(),
        "success": status == "completed",
        **kwargs
    }
    
    with open(f"{RESULTS_DIR}/{pipeline_id}_status.json", 'w') as f:
        json.dump(status_data, f, indent=2)
    
    return status_data

if __name__ == "__main__":
    logger.info("Starting execution service")
    uvicorn.run("execution_service:app", host="0.0.0.0", port=8000, reload=False)