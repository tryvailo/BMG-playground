import { use } from 'react';
import { CompetitorsHorizon } from '~/components/dashboard/competitors/CompetitorsHorizon';

interface CompetitorsPageProps {
    params: Promise<{ locale: string }>;
}

export default function CompetitorsPage(props: CompetitorsPageProps) {
    use(props.params); // Extract params to resolve Promise

    return (
        <div className="flex-1 flex flex-col p-4 lg:p-8">
            <CompetitorsHorizon />
        </div>
    );
}

