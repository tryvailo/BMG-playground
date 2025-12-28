import { use } from 'react';
import { CompetitorsOverview } from '~/components/dashboard/competitors/CompetitorsOverview';

interface CompetitorsPageProps {
    params: Promise<{ locale: string }>;
}

export default function CompetitorsPage(props: CompetitorsPageProps) {
    use(props.params); // Extract params to resolve Promise

    return (
        <div className="flex-1 flex flex-col space-y-8 p-4 lg:p-8 bg-background">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic">
                        Competitors AI <span className="text-primary NOT-italic">2026</span>
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        Strategic intelligence and market dominance analytics.
                    </p>
                </div>
            </div>

            <CompetitorsOverview />
        </div>
    );
}
