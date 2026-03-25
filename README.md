\# Async Document Processing System



This project is a full-stack system that processes uploaded documents asynchronously and shows real-time progress on the frontend.



The main goal was to handle long-running tasks without blocking the backend and to provide continuous feedback to the user during processing.



\---



\## Features



\- Upload documents through a simple UI  

\- Background processing using Celery  

\- Progress tracking stored in PostgreSQL  

\- Real-time updates using WebSockets  

\- Docker setup for backend services  



\---



\## Tech Stack



\- FastAPI (backend)  

\- React (frontend)  

\- PostgreSQL  

\- Redis  

\- Celery  

\- Docker  



\---



\## How to run



\### Backend

```bash

docker compose up --build



\---



\### Frontend

```bash

cd frontend

npm install

npm run dev



\---



How it works



When a file is uploaded, the backend creates a task and sends it to a Celery worker using Redis as the broker.



The worker processes the task step by step and updates the progress in the database.



The frontend connects via WebSocket and receives these updates in real time, which are reflected in the UI



\---



Notes

:-Processing is currently simulated in steps (can be replaced with actual logic)

:-The focus of this project is on async architecture and real-time updates



\---



Author



Dheeraj Gavendra









