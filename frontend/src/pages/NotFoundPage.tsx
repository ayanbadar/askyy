import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <section className="flex flex-col items-center py-16 text-center">
      <h1 className="text-5xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Button render={<Link to="/" />} className="mt-6" variant="outline">
        Go back home
      </Button>
    </section>
  );
}
