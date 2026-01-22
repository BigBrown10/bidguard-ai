export type Tender = {
    id: string;
    title: string;
    buyer: string;
    value: string;
    deadline: string;
    sector: string;
    description: string;
    location: string;
};

export const MOCK_TENDERS: Tender[] = [
    {
        id: "tender_001",
        title: "AI-Driven Logistics Optimization Platform",
        buyer: "Ministry of Defence (MOD)",
        value: "£5,000,000 - £8,000,000",
        deadline: "2026-03-15",
        sector: "Technology / Defence",
        description: "The MOD seeks a scalable AI solution to optimize supply chain logistics for deployed forces. The system must integrate with existing legacy databases, provide real-time predictive analytics for inventory shortages, and operate in low-bandwidth environments. Security clearance (SC) required for key personnel.",
        location: "United Kingdom (National)"
    },
    {
        id: "tender_002",
        title: "Digital Health Records Transformation",
        buyer: "NHS England",
        value: "£12,000,000",
        deadline: "2026-04-01",
        sector: "Healthcare / IT",
        description: "Procurement of a specialized cloud-native platform to interconnect disparate Electronic Health Record (EHR) systems across 5 NHS Trusts. Focus on interoperability (FHIR standards), patient data privacy (GDPR/Data Security & Protection Toolkit), and zero-downtime migration strategies.",
        location: "London & South East"
    },
    {
        id: "tender_003",
        title: "Net Zero Retrofit Framework 2026",
        buyer: "Greater London Authority (GLA)",
        value: "£45,000,000",
        deadline: "2026-02-28",
        sector: "Construction / Sustainability",
        description: "Framework agreement for the retrofitting of social housing stock to achieve EPC B rating. Scope includes installation of heat pumps, external wall insulation, and solar PV. Contractors must demonstrate social value commitments including local apprenticeships and supply chain sustainability.",
        location: "London"
    },
    {
        id: "tender_004",
        title: "Cyber Security Operations Centre (CSOC) Support",
        buyer: "Department for Transport",
        value: "£2,500,000",
        deadline: "2026-03-10",
        sector: "Cybersecurity",
        description: "Provision of 24/7 managed security monitoring, threat hunting, and incident response services. The provider will augment existing internal capabilities and assist in the migration to a SOAR (Security Orchestration, Automation and Response) platform.",
        location: "Remote / Hybrid"
    },
    {
        id: "tender_005",
        title: "Next Gen Border Control E-Gates",
        buyer: "Home Office",
        value: "£25,000,000",
        deadline: "2026-05-20",
        sector: "Technology / Security",
        description: "Design, manufacture, and maintenance of next-generation facial recognition e-gates for UK airports. Solution must process passengers in under 12 seconds with 99.9% accuracy and integrate with global watchlist databases.",
        location: "UK Airports"
    },
    {
        id: "tender_006",
        title: "Educational Cloud Devices Supply",
        buyer: "Department for Education",
        value: "£10,000,000",
        deadline: "2026-03-01",
        sector: "Education / Hardware",
        description: "Supply and configuration of 30,000 ruggedized laptops for schools in disadvantaged areas. Includes 3-year warranty, remote management software licensing, and sustainable disposal/recycling plan for old equipment.",
        location: "National"
    },
    {
        id: "tender_007",
        title: "Smart Motorway Traffic Management System",
        buyer: "National Highways",
        value: "£15,000,000",
        deadline: "2026-06-15",
        sector: "Infrastructure / Tech",
        description: "Upgrade of stopped vehicle detection (SVD) radar systems across the M25. Requirement for high-fidelity radar data processing to reduce false alarms and improve response times for traffic officers.",
        location: "South East"
    },
    {
        id: "tender_008",
        title: "Legal Services Framework - Intellectual Property",
        buyer: "Government Legal Department",
        value: "£4,000,000",
        deadline: "2026-03-20",
        sector: "Legal Services",
        description: "Panel appointment for specialized legal advice regarding state-owned intellectual property, patent defense, and international copyright law. Firms must demonstrate experience with high-profile public sector cases.",
        location: "London"
    },
    {
        id: "tender_009",
        title: "Autonomous Drone Surveying Fleet",
        buyer: "Network Rail",
        value: "£3,500,000",
        deadline: "2026-04-10",
        sector: "Transport / Tech",
        description: "Provision of Beyond Visual Line of Sight (BVLOS) drone services for automated track and vegetation inspection. Data must be processed into 3D digital twins for predictive maintenance planning.",
        location: "National Rail Network"
    },
    {
        id: "tender_010",
        title: "Civil Service HR Data Analytics Platform",
        buyer: "Cabinet Office",
        value: "£1,800,000",
        deadline: "2026-02-25",
        sector: "Data Science / HR",
        description: "Development of a secure data warehouse and dashboarding suite to analyze workforce trends, diversity statistics, and recruitment bottlenecks across the Civil Service. Must be hosted on UK-sovereign cloud infrastructure.",
        location: "London / Remote"
    }
];
