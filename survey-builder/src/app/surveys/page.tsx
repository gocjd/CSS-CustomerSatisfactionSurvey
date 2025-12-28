import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SurveyIndexPage() {
    const surveyTypes = [
        {
            id: "type1",
            title: "Type 1: Standard Form",
            description: "Traditional vertical scrolling form. Good for general purpose surveys.",
            href: "/surveys/type1"
        },
        {
            id: "type2",
            title: "Type 2: Card / Wizard",
            description: "One question at a time (Typeform style). Focuses attention.",
            href: "/surveys/type2"
        },
        {
            id: "type3",
            title: "Type 3: Conversational",
            description: "Chat-bot style interface. Engaging and informal.",
            href: "/surveys/type3"
        },
        {
            id: "type4",
            title: "Type 4: Bottom Sheet",
            description: "Mobile-first, contextual overlay. Quick feedback.",
            href: "/surveys/type4"
        }
    ];

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Survey UI Prototypes</h1>
            <p className="text-muted-foreground mb-8">
                Select a survey type below to view the demo implementation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {surveyTypes.map((type) => (
                    <Card key={type.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>{type.title}</CardTitle>
                            <CardDescription>{type.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href={type.href}>
                                <Button className="w-full">View Demo</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
