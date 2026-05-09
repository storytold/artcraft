import { PageDraw as PageDrawLib } from "@storyteller/ui-pagedraw";
import { useWebPageDrawAdapter } from "./web-adapter";

export default function PageDraw() {
  const adapter = useWebPageDrawAdapter();
  return <PageDrawLib adapter={adapter} />;
}
