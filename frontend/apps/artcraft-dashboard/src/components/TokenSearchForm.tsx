import { useState, type ComponentType, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader } from "@/components/ui/card";
import { IconArrowRight, IconSearch } from "@tabler/icons-react";

interface TokenSearchFormProps {
  title: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  buttonLabel: string;
  /** Builds the destination route given a trimmed token. */
  buildHref: (token: string) => string;
  icon: ComponentType<{ className?: string }>;
}

export function TokenSearchForm({
  title,
  description,
  inputLabel,
  placeholder,
  buttonLabel,
  buildHref,
  icon: Icon,
}: TokenSearchFormProps) {
  const navigate = useNavigate();
  const [token, setToken] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    navigate(buildHref(trimmed));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Icon className="size-6 text-muted-foreground" />
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <label
              htmlFor="token"
              className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
              {inputLabel}
            </label>
            <div className="flex gap-2">
              <Input
                id="token"
                type="text"
                placeholder={placeholder}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="flex-1 font-mono text-sm"
                autoFocus
              />
              <Button type="submit" disabled={!token.trim()}>
                <IconSearch className="size-4" />
                {buttonLabel}
                <IconArrowRight className="size-4" />
              </Button>
            </div>
          </form>
        </CardHeader>
      </Card>
    </div>
  );
}
