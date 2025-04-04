# 🤖 Data Agents Platform

<div align="center">
  <img src="https://img.shields.io/badge/Status-Alpha-yellow" alt="Alpha Status" />
  <img src="https://img.shields.io/badge/Next.js-14-black" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-✓-blue" alt="TypeScript" />
  <img src="https://img.shields.io/badge/UI-Shadcn%20+%20Tailwind-purple" alt="UI" />
</div>

<br />



https://github.com/user-attachments/assets/f591bc23-3a19-43eb-9c92-e4b5bb3ba57f




<div align="center">
  <h3>💬 Data Agents, Really!</h3>
  <p>Data Agent is an agentic AI harnessing GenAI to automate and streamline data engineering workflows.  
  By delivering complete, well-prepared data requests, it saves time and reduces bottlenecks across teams.</p>  
</div>

## ✨ Features

- 🤖 **Multi-agent collaboration** - Engage with specialized data engineering agents
- 🔄 **Multiple backend support** - Connect to OpenAI, Claude, or Ollama for private deployments
- 🔗 **n8n integration** - Use n8n workflows for agent orchestration
- 🎯 **Strategy-based approach** - Different strategies for various data engineering tasks
- 🌙 **Modern dark UI** - Beautiful, responsive interface inspired by LobeChat
- 🚀 **Docker ready** - Easy deployment with Docker Compose

## 🚀 Quick Start

The fastest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/HotTechStack/dataagents.git
cd dataagents

# Start the application
docker-compose up -d
```

### 🔧 Setup Steps

1. Once the containers are running, go to n8n at http://localhost:5678
2. Upload the workflow from the `agents/n8n/conversations` directory
3. Configure your API keys:
   - In Docker Compose: update OpenAI/Claude/Gemini key
   - In n8n workflow: click on OpenAI/Claude/Gemini model block and add your key
   - See [n8n documentation](https://docs.n8n.io/integrations/builtin/credentials/openai/#using-api-key) for more details

4. Visit http://localhost:3000 and start interacting with your agents!

## 🧩 Running Locally

If you prefer running the application without Docker:

```bash
# Clone the repository
git clone https://github.com/HotTechStack/dataagents.git
cd dataagents

# Install dependencies
pnpm install

# Start the development server
pnpm run dev
```

You can still use your own hosted n8n instance or the Docker integrated version while running the frontend locally.

## 🧠 Available Agents

- **Data Architect** - Designs data infrastructure and systems
- **Pipeline Engineer** - Builds efficient data pipelines
- **Data Analyst** - Analyzes and interprets complex data
- **Data Scientist** - Applies statistical models and machine learning
- **Governance Specialist** - Ensures data quality and compliance

## 🎯 Strategy Types


## 🔮 Upcoming Features

We're actively working on the following enhancements:

- 🎯 **Strategy Types** - More Strategy Types backend for debate and Continuous Discussion
- 📝 **Code Execution** - Run and test code snippets directly in the chat
- 🔄 **Workflow Builder** - Create custom agent workflows with a visual editor
- 🌐 **Multi-source Data Connectors** - Connect to various data sources
- 🏗️ **Data Engineering Specific MCP Server** - Optimized for data engineering workflows
- 🧠 **Deep Thinking for Data Engineering** - Enhanced reasoning capabilities for complex data problems
- 💾 **Database with histories** - Persistent conversation storage with vectordbs for semantic search and caching


## 🧩 Architecture

The application is built with a modern stack:

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, Shadcn UI
- **State Management**: Zustand for global state
- **Orchestration**: n8n for workflow management
- **AI Integration**: OpenAI, Claude, and Ollama support

## 🤝 Contributing

Contributions are always welcome! Here's how you can help:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/amazing-feature`
3. Make your changes and commit them: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

### 🐛 Bug Reports

If you encounter any issues, please help us improve by [creating a bug report](https://github.com/HotTechStack/dataagents/issues/new?template=bug_report.md).

Include as much information as possible:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details (browser, OS, etc.)

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.