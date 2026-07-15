import { useState } from "react";
import { generatePageWithAI } from "@/services/aiService";
import { toast } from "@/lib/toast";

interface Props {
  content: string;
  onApply: (html: string) => void;
}

export default function AiAssistant({ content, onApply }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
        toast.error("Please enter a prompt");
        return;
    }

    try {
        setLoading(true);

        const res = await generatePageWithAI({
        prompt,
        content,
        });

        onApply(res.html);
        toast.success("Content generated!");
        setPrompt("");

    } catch (error) {
        toast.error("Content generation failed!");
    } finally {
        setLoading(false);
    }
    };

  return (
    <div className="card mb-3 border-primary">
      <div className="card-header fw-bold">
        🤖 AI Page Assistant
      </div>

      <div className="card-body">
        <textarea
          className="form-control mb-2"
          rows={3}
          placeholder="Tell the AI what to do — create, modify, or enhance this page (e.g. Improve layout, add CTA, modernize design)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Thinking..." : "Generate / Enhance"}
        </button>
      </div>
    </div>
  );
}
