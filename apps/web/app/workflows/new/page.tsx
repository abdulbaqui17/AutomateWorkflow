"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Define nodeTypes outside component to prevent React Flow warning
const nodeTypes = {};

// Canvas area containing React Flow and empty-state card
function Canvas({
  nodes,
  setNodes,
  edges,
  setEdges,
  meta,
  setMeta,
  onNodeClick,
  showSidebar,
  setShowSidebar,
}: {
  nodes: Node[];
  setNodes: any;
  edges: Edge[];
  setEdges: any;
  meta: { [nodeId: string]: { availableId: string; name: string; kind: "trigger" | "action"; config: {} } };
  setMeta: any;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  showSidebar: boolean;
  setShowSidebar: any;
}) {
  const { screenToFlowPosition } = useReactFlow();

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer.getData("application/reactflow"));
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    if (data.type === "trigger") {
      const existingTrigger = nodes.find((node) => meta[node.id]?.kind === "trigger");
      if (existingTrigger) return; // Only one trigger allowed

      const nodeId = `trigger-${Date.now()}`;
      const newNode: Node = { id: nodeId, type: "default", position, data: { label: data.name } };
      setNodes((nds: Node[]) => [...nds, newNode]);
      setMeta((prev: any) => ({
        ...prev,
        [nodeId]: { availableId: data.id, name: data.name, kind: "trigger", config: {} },
      }));
      
      // Connect "add-first-step" to this trigger
      const addFirstStepNode = nodes.find(n => n.id === "add-first-step");
      if (addFirstStepNode) {
        const newEdge: Edge = { id: `edge-add-first-step-${nodeId}`, source: "add-first-step", target: nodeId };
        setEdges((eds: Edge[]) => [...eds, newEdge]);
      }
    } else if (data.type === "action") {
      const nodeId = `action-${Date.now()}`;
      const newNode: Node = { id: nodeId, type: "default", position, data: { label: data.name } };

      const sortedNodes = nodes
        .filter((node) => meta[node.id]?.kind === "trigger" || meta[node.id]?.kind === "action")
        .sort((a, b) => {
          const aMeta = meta[a.id];
          const bMeta = meta[b.id];
          if (aMeta?.kind === "trigger") return -1;
          if (bMeta?.kind === "trigger") return 1;
          return 0;
        });

      const lastNode = sortedNodes.length > 0 ? sortedNodes[sortedNodes.length - 1] : nodes.find(n => n.id === "add-first-step");

      setNodes((nds: Node[]) => [...nds, newNode]);
      setMeta((prev: any) => ({ ...prev, [nodeId]: { availableId: data.id, name: data.name, kind: "action", config: {} } }));

      if (lastNode) {
        const newEdge: Edge = { id: `edge-${lastNode.id}-${nodeId}`, source: lastNode.id, target: nodeId };
        setEdges((eds: Edge[]) => [...eds, newEdge]);
      }
    }
  };

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={(changes) => setNodes((nds: Node[]) => applyNodeChanges(changes, nds))}
        onEdgesChange={(changes) => setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds))}
        onNodeClick={onNodeClick}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} color="#ffffff10" />
        <Controls position="top-right" />
      </ReactFlow>
    </div>
  );
}

// Form Element Interface
interface FormElement {
  id: string;
  type: "text" | "email" | "number" | "textarea" | "select";
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select type
}

// Form Trigger Configuration Component
function OnFormSubmissionTrigger({ 
  config, 
  onConfigChange,
  zapId 
}: { 
  config: any; 
  onConfigChange: (config: any) => void;
  zapId?: string | null;
}) {
  const [formTitle, setFormTitle] = useState(config?.formTitle || "");
  const [formDescription, setFormDescription] = useState(config?.formDescription || "");
  const [formElements, setFormElements] = useState<FormElement[]>(config?.formElements || []);
  const [formId, setFormId] = useState<string | null>(config?.formId || null);
  const [published, setPublished] = useState(config?.published || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formUrl = formId 
    ? `${API_BASE}/api/v1/forms/${formId}/submit`
    : `${API_BASE}/api/v1/forms/new/submit`;
  
  const publicFormUrl = formId 
    ? `http://localhost:3000/forms/${formId}`
    : null;

  // Load existing form data if formId exists
  useEffect(() => {
    if (formId) {
      loadFormData();
    }
  }, [formId]);

  const loadFormData = async () => {
    if (!formId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/v1/forms/${formId}`, {
        headers: { Authorization: token || "" }
      });

      if (!response.ok) throw new Error("Failed to load form");
      
      const data = await response.json();
      setFormTitle(data.name || "");
      setFormDescription(data.description || "");
      setFormElements(data.fields || []);
      setPublished(data.published || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load form");
      console.error("Error loading form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFormData = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        name: formTitle,
        description: formDescription,
        fields: formElements,
        published: published
      };

      let response;
      if (formId) {
        // Update existing form
        response = await fetch(`${API_BASE}/api/v1/forms/${formId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || ""
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create new form
        response = await fetch(`${API_BASE}/api/v1/forms`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token || ""
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setFormId(data.id);
      setPublished(data.published || false);
      
      // Update config with formId
      updateConfig({ 
        formTitle, 
        formDescription, 
        formElements, 
        formId: data.id,
        published: data.published || false,
        formUrl: `${API_BASE}/api/v1/forms/${data.id}/submit`
      });

      alert("Form saved successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save form";
      setError(errorMessage);
      console.error("Error saving form:", err);
      alert(`Failed to save form: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formUrl);
    alert("URL copied to clipboard!");
  };

  const addFormElement = () => {
    const newElement: FormElement = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
      placeholder: "",
      required: false
    };
    const updated = [...formElements, newElement];
    setFormElements(updated);
    updateConfig({ formTitle, formDescription, formElements: updated, formId, formUrl });
  };

  const removeFormElement = (id: string) => {
    const updated = formElements.filter(el => el.id !== id);
    setFormElements(updated);
    updateConfig({ formTitle, formDescription, formElements: updated, formId, formUrl });
  };

  const updateFormElement = (id: string, updates: Partial<FormElement>) => {
    const updated = formElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setFormElements(updated);
    updateConfig({ formTitle, formDescription, formElements: updated, formId, formUrl });
  };

  const updateConfig = (updates: any) => {
    onConfigChange({ ...config, ...updates });
  };

  const handleTitleChange = (value: string) => {
    setFormTitle(value);
    updateConfig({ formTitle: value, formDescription, formElements, formId, formUrl });
  };

  const handleDescriptionChange = (value: string) => {
    setFormDescription(value);
    updateConfig({ formTitle, formDescription: value, formElements, formId, formUrl });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-white/60">Loading form data...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-lg font-semibold text-white">On form submission</h2>
        <button
          onClick={saveFormData}
          disabled={isSaving}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Form"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Form Title */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium text-white/70">Form Title</label>
        <input
          type="text"
          value={formTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. Contact us"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Form Description */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium text-white/70">Form Description</label>
        <input
          type="text"
          value={formDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="e.g. We'll get back to you soon"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Publish Toggle */}
      <div className="mb-6">
        <label className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-3">
          <div>
            <div className="text-sm font-medium text-white">Make form publicly accessible</div>
            <div className="text-xs text-white/50">When published, anyone with the link can view and submit this form</div>
            {published && publicFormUrl && (
              <div className="mt-2 flex items-center gap-2">
                <a 
                  href={publicFormUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  {publicFormUrl}
                </a>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(publicFormUrl);
                    alert("Public URL copied to clipboard!");
                  }}
                  className="text-xs text-white/50 hover:text-white/70"
                >
                  Copy
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPublished(!published)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              published ? "bg-purple-600" : "bg-white/20"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                published ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </label>
        {!published && formId && (
          <p className="mt-1 text-xs text-yellow-400/70">Form is currently private. Toggle to make it public.</p>
        )}
      </div>

      {/* Form Elements */}
      <div className="mb-4">
        <label className="mb-3 block text-xs font-medium text-white/70">Form Elements</label>
        {formElements.length > 0 && (
          <div className="mb-3 space-y-3">
            {formElements.map((element) => (
              <div key={element.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-start justify-between">
                  <input
                    type="text"
                    value={element.label}
                    onChange={(e) => updateFormElement(element.id, { label: e.target.value })}
                    placeholder="Field label"
                    className="flex-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    onClick={() => removeFormElement(element.id)}
                    className="ml-2 text-red-400 hover:text-red-300 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-2">
                  <select
                    value={element.type}
                    onChange={(e) => updateFormElement(element.id, { type: e.target.value as FormElement["type"] })}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="textarea">Textarea</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={element.required}
                      onChange={(e) => updateFormElement(element.id, { required: e.target.checked })}
                      className="rounded"
                    />
                    Required
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={addFormElement}
          className="w-full rounded-md border-2 border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
        >
          + Add Form Element
        </button>
      </div>
    </div>
  );
}

// Telegram Bot Trigger Configuration Component
function TelegramBotTriggerConfig({
  config,
  onConfigChange,
}: {
  config: any;
  onConfigChange: (config: any) => void;
}) {
  const [botName, setBotName] = useState(config?.botName || "");
  const [botToken, setBotToken] = useState(config?.botToken || "");
  const [botId, setBotId] = useState<string | null>(config?.botId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(config?.webhookUrl || null);

  const saveBotConfig = async () => {
    if (!botName.trim()) {
      setError("Bot name is required");
      return;
    }
    if (!botToken.trim()) {
      setError("Bot token is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/v1/telegram/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({
          name: botName,
          token: botToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setBotId(data.id);

      // Webhook URL from backend response (automatically configured)
      const webhook = data.webhookUrl || `${API_BASE}/api/v1/telegram/webhook/${data.id}`;
      setWebhookUrl(webhook);

      // Update config
      const updatedConfig = {
        botName,
        botToken, // Note: Backend stores this encrypted
        botId: data.id,
        webhookUrl: webhook,
        baseUrl: "https://api.telegram.org",
        webhookStatus: data.webhookStatus,
      };
      onConfigChange(updatedConfig);

      // Show appropriate message based on webhook setup status
      if (data.webhookStatus === "success") {
        alert("✅ Bot registered successfully!\n🔗 Webhook configured automatically!\n\nYour bot is ready to receive messages.");
      } else if (data.webhookStatus === "failed") {
        alert(`⚠️ Bot registered but webhook setup failed:\n${data.webhookError}\n\nYou may need to set it manually or configure PUBLIC_WEBHOOK_URL environment variable.`);
      } else {
        alert("Bot registered successfully!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to register bot";
      setError(errorMessage);
      console.error("Error registering bot:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    if (webhookUrl) {
      navigator.clipboard.writeText(webhookUrl);
      alert("Webhook URL copied to clipboard!");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-lg font-semibold text-white">Telegram Bot Trigger</h2>
        <button
          onClick={saveBotConfig}
          disabled={isSaving || !botName.trim() || !botToken.trim()}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : botId ? "Update Bot" : "Register Bot"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {botId && (
        <div className="mb-4 rounded-md bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400">
          Bot registered successfully! ID: {botId}
        </div>
      )}

      {/* Bot Name */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium text-white/70">
          Bot Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
          placeholder="e.g. My Workflow Bot"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-white/50">A friendly name to identify your bot</p>
      </div>

      {/* Bot Token */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium text-white/70">
          Bot Token <span className="text-red-400">*</span>
        </label>
        <input
          type="password"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none font-mono"
        />
        <p className="mt-1 text-xs text-white/50">
          Get this from{" "}
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            @BotFather
          </a>{" "}
          on Telegram
        </p>
      </div>

      {/* Base URL Info */}
      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium text-white/70">Base URL</label>
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
          https://api.telegram.org
        </div>
        <p className="mt-1 text-xs text-white/50">Default Telegram API base URL</p>
      </div>

      {/* Webhook URL (shown after registration) */}
      {webhookUrl && (
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium text-white/70">Webhook URL</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={webhookUrl}
              readOnly
              className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 font-mono"
            />
            <button
              onClick={copyWebhookUrl}
              className="rounded-md bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20 transition"
            >
              Copy
            </button>
          </div>
          <p className="mt-2 text-xs text-white/50">
            Set this webhook URL on Telegram using:{" "}
            <code className="text-purple-400">
              curl -X POST https://api.telegram.org/bot{"{YOUR_BOT_TOKEN}"}/setWebhook -d
              url="{webhookUrl}"
            </code>
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="rounded-md border border-blue-500/20 bg-blue-500/10 px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-blue-300">Setup Instructions:</h3>
        <ol className="space-y-2 text-xs text-blue-200/80">
          <li>1. Open Telegram and search for @BotFather</li>
          <li>2. Send /newbot command and follow the instructions</li>
          <li>3. Copy the bot token provided by BotFather</li>
          <li>4. Paste the token above and save</li>
          <li>5. Copy the webhook URL and set it using the curl command shown</li>
          <li>6. Your bot is ready to trigger workflows!</li>
        </ol>
      </div>
    </div>
  );
}

// Send Email Action Configuration Component
function SendEmailActionConfig({ config, onConfigChange }: { config: any; onConfigChange: (config: any) => void }) {
  const [to, setTo] = useState<string>(config?.to || "");
  const [subject, setSubject] = useState<string>(config?.subject || "");
  const [body, setBody] = useState<string>(config?.body || "");

  return (
    <div className="space-y-4">
      <h2 className="mb-4 text-xl font-bold text-white">Send Email Configuration</h2>

      {/* Available Variables Helper */}
      <div className="rounded-md border border-purple-500/20 bg-purple-500/10 px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-purple-300">💡 Available Variables</h3>
        <div className="space-y-1 text-xs text-purple-200/80">
          <div><code className="bg-purple-900/30 px-1 py-0.5 rounded">{'{{submission.email}}'}</code> - Form email field</div>
          <div><code className="bg-purple-900/30 px-1 py-0.5 rounded">{'{{submission.name}}'}</code> - Form name field</div>
          <div><code className="bg-purple-900/30 px-1 py-0.5 rounded">{'{{trigger.email}}'}</code> - Telegram user email</div>
          <div><code className="bg-purple-900/30 px-1 py-0.5 rounded">{'{{trigger.firstName}}'}</code> - Telegram first name</div>
          <div><code className="bg-purple-900/30 px-1 py-0.5 rounded">{'{{trigger.telegramUserId}}'}</code> - Telegram user ID</div>
        </div>
        <p className="mt-2 text-xs text-purple-300">Use these placeholders in any field below - they'll be replaced with actual data!</p>
      </div>

      {/* To Email */}
      <div>
        <label className="mb-1 block text-sm font-medium text-white/80">
          To Email Address <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          placeholder="{{submission.email}} or user@example.com"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            onConfigChange({ to: e.target.value, subject, body });
          }}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none font-mono"
        />
        <p className="mt-1 text-xs text-white/50">
          Use <code className="text-purple-400">{'{{submission.email}}'}</code> for dynamic recipient
        </p>
      </div>

      {/* Subject */}
      <div>
        <label className="mb-1 block text-sm font-medium text-white/80">
          Email Subject <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          placeholder="Welcome {{submission.name}}!"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            onConfigChange({ to, subject: e.target.value, body });
          }}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none font-mono"
        />
        <p className="mt-1 text-xs text-white/50">
          You can use variables like <code className="text-purple-400">{'{{submission.name}}'}</code>
        </p>
      </div>

      {/* Body */}
      <div>
        <label className="mb-1 block text-sm font-medium text-white/80">
          Email Body <span className="text-red-400">*</span>
        </label>
        <textarea
          placeholder="<h1>Hello {{submission.name}}!</h1><p>Thanks for submitting the form.</p>"
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            onConfigChange({ to, subject, body: e.target.value });
          }}
          rows={10}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 focus:border-purple-500 focus:outline-none font-mono"
        />
        <p className="mt-1 text-xs text-white/50">
          HTML supported. Use variables like <code className="text-purple-400">{'{{submission.email}}'}</code>
        </p>
      </div>

      {/* Configuration Summary */}
      {to && subject && body && (
        <div className="rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3">
          <h3 className="mb-2 text-sm font-semibold text-green-300">✓ Configuration Complete</h3>
          <div className="space-y-1 text-xs text-green-200/80">
            <div><span className="font-semibold">To:</span> {to}</div>
            <div><span className="font-semibold">Subject:</span> {subject}</div>
            <div><span className="font-semibold">Body:</span> {body.length} characters</div>
          </div>
        </div>
      )}

      {/* Example */}
      <div className="rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-green-300">✨ Example Configuration</h3>
        <div className="space-y-2 text-xs text-green-200/80 font-mono">
          <div><span className="text-green-400">To:</span> {'{{submission.email}}'}</div>
          <div><span className="text-green-400">Subject:</span> Thanks {'{{submission.name}}'}!</div>
          <div><span className="text-green-400">Body:</span></div>
          <pre className="mt-1 bg-green-900/20 p-2 rounded text-[10px] overflow-x-auto">
{`<h1>Hello {{submission.name}}!</h1>
<p>Thank you for submitting the form.</p>
<p>We received your email: {{submission.email}}</p>`}
          </pre>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-md border border-blue-500/20 bg-blue-500/10 px-4 py-3">
        <h3 className="mb-2 text-sm font-semibold text-blue-300">💡 Tips:</h3>
        <ul className="space-y-2 text-xs text-blue-200/80">
          <li>• Use <code className="bg-blue-900/30 px-1 rounded">{'{{variable}}'}</code> for dynamic data from triggers</li>
          <li>• HTML is supported in the email body</li>
          <li>• Use &lt;h1&gt;, &lt;p&gt;, &lt;strong&gt; tags for formatting</li>
          <li>• Test with your own email first: <code className="bg-blue-900/30 px-1 rounded">youremail@example.com</code></li>
        </ul>
      </div>
    </div>
  );
}

export default function WorkflowBuilderPage() {
  const [nodes, setNodes] = useState<Node[]>([{ id: "add-first-step", type: "default", position: { x: 400, y: 300 }, data: { label: "Add first step" } }]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [availableTriggers, setAvailableTriggers] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [meta, setMeta] = useState<{ [nodeId: string]: { availableId: string; name: string; kind: "trigger" | "action"; config: any } }>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [configJson, setConfigJson] = useState<string>("{}");
  const [workflowName, setWorkflowName] = useState<string>("");
  const [savedZapId, setSavedZapId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showRunModal, setShowRunModal] = useState<boolean>(false);
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [runMetaData, setRunMetaData] = useState<string>("{}");

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/available-triggers`).then((res) => res.json()).then(setAvailableTriggers);
    fetch(`${API_BASE}/api/v1/available-actions`).then((res) => res.json()).then(setAvailableActions);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedNodeId(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    if (node.id === "add-first-step") {
      setShowSidebar(true);
      return;
    }
    setSelectedNodeId(node.id);
    const nodeMeta = meta[node.id];
    if (nodeMeta) setConfigJson(JSON.stringify(nodeMeta.config, null, 2));
  };

  const handleUpdateConfig = () => {
    if (!selectedNodeId) return;
    try {
      const parsedConfig = JSON.parse(configJson);
      setMeta((prev: any) => {
        const existingMeta = prev[selectedNodeId];
        if (!existingMeta) return prev;
        return { ...prev, [selectedNodeId]: { ...existingMeta, config: parsedConfig } };
      });
    } catch {
      alert("Invalid JSON format");
    }
  };

  const handleSaveWorkflow = async () => {
    if (!workflowName.trim()) {
      alert("Please enter a workflow name");
      return;
    }

    const triggerNode = Object.entries(meta).find(([_, nodeMeta]) => nodeMeta.kind === "trigger");
    if (!triggerNode) {
      alert("Please add a trigger to your workflow");
      return;
    }

    const actionNodes = Object.entries(meta)
      .filter(([_, nodeMeta]) => nodeMeta.kind === "action")
      .map(([nodeId, nodeMeta]) => {
        const node = nodes.find((n) => n.id === nodeId);
        return { nodeId, nodeMeta, position: node?.position.y || 0 };
      })
      .sort((a, b) => a.position - b.position);

    const payload = {
      name: workflowName.trim(),
      availableTriggerId: (triggerNode as any)[1].availableId,
      triggerMetadata: (triggerNode as any)[1].config || {},
      actions: actionNodes.map(({ nodeMeta }) => ({ availableActionId: (nodeMeta as any).availableId, actionMetadata: (nodeMeta as any).config || {} })),
    };

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/v1/zap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token || "" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save workflow");
      const data = await response.json();
      setSavedZapId(data.zap.id);
      alert("Workflow saved");
    } catch (error) {
      console.error("Error saving workflow:", error);
      alert("Failed to save workflow. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunWorkflow = async () => {
    if (!savedZapId) return;

    let metaData = {} as any;
    try {
      metaData = JSON.parse(runMetaData);
    } catch (error) {
      alert("Invalid JSON format in meta data");
      return;
    }

    setIsRunning(true);
    setShowRunModal(false);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/api/v1/zap/${savedZapId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token || "" },
        body: JSON.stringify({ metaData }),
      });
      if (!response.ok) throw new Error("Failed to run workflow");
      const data = await response.json();
      alert(`Workflow run started! Run ID: ${data.zapRunId}`);
    } catch (error) {
      console.error("Error running workflow:", error);
      alert("Failed to run workflow. Please try again.");
    } finally {
      setIsRunning(false);
      setRunMetaData("{}");
    }
  };

  const addNode = (type: "trigger" | "action", id: string, name: string) => {
    // Calculate position to the right of the last node or after "add-first-step"
    const existingWorkflowNodes = nodes.filter((node) => node.id !== "add-first-step" && (meta[node.id]?.kind === "trigger" || meta[node.id]?.kind === "action"));
    const baseX = existingWorkflowNodes.length > 0 ? Math.max(...existingWorkflowNodes.map(n => n.position.x)) + 200 : 600;
    const position = { x: baseX, y: 300 };
    
    if (type === "trigger") {
      const existingTrigger = nodes.find((node) => meta[node.id]?.kind === "trigger");
      if (existingTrigger) return;
      const nodeId = `trigger-${Date.now()}`;
      const newNode: Node = { id: nodeId, type: "default", position, data: { label: name } };
      setNodes((nds: Node[]) => [...nds, newNode]);
      setMeta((prev: any) => ({ ...prev, [nodeId]: { availableId: id, name, kind: "trigger", config: {} } }));
      
      // Connect "add-first-step" to this trigger
      const addFirstStepNode = nodes.find(n => n.id === "add-first-step");
      if (addFirstStepNode) {
        const newEdge: Edge = { id: `edge-add-first-step-${nodeId}`, source: "add-first-step", target: nodeId };
        setEdges((eds: Edge[]) => [...eds, newEdge]);
      }
    } else {
      const nodeId = `action-${Date.now()}`;
      const newNode: Node = { id: nodeId, type: "default", position, data: { label: name } };
      const sortedNodes = nodes
        .filter((node) => meta[node.id]?.kind === "trigger" || meta[node.id]?.kind === "action")
        .sort((a, b) => {
          const aMeta = meta[a.id];
          const bMeta = meta[b.id];
          if (aMeta?.kind === "trigger") return -1;
          if (bMeta?.kind === "trigger") return 1;
          return 0;
        });
      const lastNode = sortedNodes.length > 0 ? sortedNodes[sortedNodes.length - 1] : nodes.find(n => n.id === "add-first-step");
      setNodes((nds: Node[]) => [...nds, newNode]);
      setMeta((prev: any) => ({ ...prev, [nodeId]: { availableId: id, name, kind: "action", config: {} } }));
      if (lastNode) {
        const newEdge: Edge = { id: `edge-${lastNode.id}-${nodeId}`, source: lastNode.id, target: nodeId };
        setEdges((eds: Edge[]) => [...eds, newEdge]);
      }
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      {/* Header */}
      <header className="relative z-10 h-14 border-b border-white/10 bg-white/[0.05] backdrop-blur flex items-center justify-between px-6 text-white/80">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold bg-[linear-gradient(120deg,#7C3AED_0%,#FF6B2C_50%,#FACC15_100%)] bg-clip-text text-transparent">Workflow Builder</h1>
          <input
            type="text"
            placeholder="Enter workflow name..."
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-purple-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveWorkflow}
            disabled={isSaving || !workflowName.trim()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_45px_-25px_rgba(255,77,151,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-[1.03] hover:brightness-110"
            style={{ backgroundImage: "linear-gradient(120deg,#FF4D97 0%,#FFA927 100%)" }}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setShowRunModal(true)}
            disabled={!savedZapId || isRunning}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_45px_-25px_rgba(255,77,151,0.6)] disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-[1.03] hover:brightness-110"
            style={{ backgroundImage: "linear-gradient(120deg,#FF4D97 0%,#FFA927 100%)" }}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
      </header>

      {/* Main content canvas */}
      <div
        className="relative w-full min-h-[calc(100vh-56px)] overflow-hidden bg-[#0b0f17] text-white"
        style={{
          backgroundImage: `
            radial-gradient(1200px 600px at 80% -10%, rgba(124,58,237,0.25), transparent 60%),
            radial-gradient(1000px 500px at -10% 100%, rgba(255,107,44,0.18), transparent 55%),
            radial-gradient(1px 1px at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "cover, cover, 24px 24px",
        }}
      >
        {/* Soft vignette overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.35))]" />

        {/* Sidebar (left rail) */}
        {showSidebar && (
          <aside className="absolute left-0 top-0 z-10 h-full min-w-[280px] border-r border-white/10 bg-black/20 p-6 backdrop-blur-sm">
            <div className="mb-4 flex justify-end">
              <button onClick={() => setShowSidebar(false)} className="text-white/50 transition-colors hover:text-white">
                ✕
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="px-4 py-3 text-xs uppercase tracking-wide text-white/60">Triggers</h3>
                <div className="space-y-2">
                  {Array.isArray(availableTriggers) &&
                    (availableTriggers as any[])
                      .filter((trigger: any) => trigger.name !== "Webhook Trigger" && trigger.name !== "Telegram Bot Trigger")
                      .map((trigger: any) => (
                      <div
                        key={trigger.id}
                        draggable
                        data-node-type="trigger"
                        data-id={trigger.id}
                        data-name={trigger.name}
                        onClick={() => addNode("trigger", trigger.id, trigger.name)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/reactflow",
                            JSON.stringify({ type: "trigger", id: trigger.id, name: trigger.name }),
                          );
                        }}
                        className="cursor-move rounded-md px-3 py-2 text-white/80 transition-colors hover:bg-white/10"
                      >
                        {trigger.name}
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h3 className="px-4 py-3 text-xs uppercase tracking-wide text-white/60">Actions</h3>
                <div className="space-y-2">
                  {Array.isArray(availableActions) &&
                    (availableActions as any[]).filter(a => !['http_request','db_write','send_email'].includes(a.name)).map((action: any) => (
                      <div
                        key={action.id}
                        draggable
                        data-node-type="action"
                        data-id={action.id}
                        data-name={action.name}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/reactflow",
                            JSON.stringify({ type: "action", id: action.id, name: action.name }),
                          );
                        }}
                        className="cursor-move rounded-md px-3 py-2 text-white/80 transition-colors hover:bg-white/10"
                      >
                        {action.name}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Canvas area to the right of sidebar */}
        <main className="absolute right-0 top-0 h-full" style={{ width: showSidebar ? "calc(100% - 280px)" : "100%" }}>
          <div className="h-full w-full overflow-hidden">
            <ReactFlowProvider>
              <Canvas
                nodes={nodes}
                setNodes={setNodes}
                edges={edges}
                setEdges={setEdges}
                meta={meta}
                setMeta={setMeta}
                onNodeClick={handleNodeClick}
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
              />
            </ReactFlowProvider>
          </div>
        </main>

        {/* Right config panel */}
        {selectedNodeId && (
          <aside className="absolute right-0 top-0 z-10 h-full w-[400px] border-l border-white/10 bg-black/20 p-6 text-white/80 backdrop-blur-sm overflow-y-auto">
            {meta[selectedNodeId]?.name === "Form Trigger" ? (
              <OnFormSubmissionTrigger
                config={meta[selectedNodeId]?.config || {}}
                zapId={savedZapId}
                onConfigChange={(newConfig) => {
                  setMeta((prev: any) => ({
                    ...prev,
                    [selectedNodeId]: {
                      ...prev[selectedNodeId],
                      config: newConfig
                    }
                  }));
                }}
              />
            ) : meta[selectedNodeId]?.name === "Telegram Bot Trigger" ? (
              <TelegramBotTriggerConfig
                config={meta[selectedNodeId]?.config || {}}
                onConfigChange={(newConfig) => {
                  setMeta((prev: any) => ({
                    ...prev,
                    [selectedNodeId]: {
                      ...prev[selectedNodeId],
                      config: newConfig
                    }
                  }));
                }}
              />
            ) : meta[selectedNodeId]?.name === "send_email_nodemailer" ? (
              <SendEmailActionConfig
                config={meta[selectedNodeId]?.config || {}}
                onConfigChange={(newConfig) => {
                  setMeta((prev: any) => ({
                    ...prev,
                    [selectedNodeId]: {
                      ...prev[selectedNodeId],
                      config: newConfig
                    }
                  }));
                }}
              />
            ) : (
              <>
                <div className="mb-2 text-sm font-semibold">Node Configuration</div>
                <textarea
                  value={configJson}
                  onChange={(e) => setConfigJson(e.target.value)}
                  className="h-[calc(100%-80px)] w-full resize-none rounded-md border border-white/10 bg-white/5 p-2 font-mono text-xs text-white/90 focus:outline-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleUpdateConfig}
                    className="rounded-md px-3 py-1.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.03] hover:brightness-110"
                    style={{ backgroundImage: "linear-gradient(120deg,#FF4D97 0%,#FFA927 100%)" }}
                  >
                    Update Config
                  </button>
                </div>
              </>
            )}
          </aside>
        )}
      </div>

      {/* Run Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 max-w-[90vw] rounded-lg border border-[#2A2B2F] bg-[#1A1B1F] p-6 text-[#9CA3AF]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Run Workflow</h3>
              <button onClick={() => setShowRunModal(false)} className="text-white/50 transition-colors hover:text-white">
                ✕
              </button>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-[#9CA3AF]">Meta Data (JSON)</label>
              <textarea
                value={runMetaData}
                onChange={(e) => setRunMetaData(e.target.value)}
                className="h-32 w-full rounded-md border border-[#2A2B2F] bg-[#1A1B1F] p-3 font-mono text-sm text-white placeholder-[#9CA3AF] focus:border-[#FF4D97]/60 focus:outline-none"
                placeholder="{}"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRunModal(false)} className="flex-1 rounded-lg border border-[#2A2B2F] bg-[#1A1B1F] px-4 py-2 text-sm font-medium text-white transition hover:brightness-110">
                Cancel
              </button>
              <button
                onClick={handleRunWorkflow}
                disabled={isRunning}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 transition-transform duration-200 hover:scale-[1.03] hover:brightness-110"
                style={{ backgroundImage: "linear-gradient(120deg,#FF4D97 0%,#FFA927 100%)" }}
              >
                {isRunning ? "Running..." : "Run Workflow"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

