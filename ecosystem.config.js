module.exports = {
  apps: [
    {
      name: "talleres-backend",
      cwd: __dirname,
      script: ".venv/bin/python",
      args: "-m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000",
      interpreter: "none",
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        PYTHONUNBUFFERED: "1",
      },
    },
  ],
};
