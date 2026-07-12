import { cn } from "@/lib/utils/index";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/pricing-card";
import { CheckCircle2, Users, Briefcase, Building } from "lucide-react";

export function PricingSection() {
	return (
		<section className="w-full">
			<div className="mx-auto mb-4 max-w-md space-y-2">
				<div className="flex justify-center">
					<div className="rounded-md border px-4 py-1 text-sm">Pricing</div>
				</div>
				<h2 className="text-center font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
					Plans that Scale with You
				</h2>
				<p className="text-center text-muted-foreground text-sm md:text-base">
					Whether you're just starting out or growing fast, our flexible pricing
					has you covered.
				</p>
			</div>
			<div className="mx-auto grid w-full max-w-4xl gap-4 p-6 md:grid-cols-3">
				{plans.map((plan, index) => (
					<PricingCard.Card
						className={cn("w-full max-w-full", index === 1 && "md:scale-105")}
						key={plan.name}
					>
						<PricingCard.Header isPopular={index === 1}>
							<PricingCard.Plan>
								<PricingCard.PlanName>
									{plan.icon}
									<span>{plan.name}</span>
								</PricingCard.PlanName>
								{plan.badge && (
									<PricingCard.Badge>{plan.badge}</PricingCard.Badge>
								)}
							</PricingCard.Plan>
							<PricingCard.Price>
								<PricingCard.MainPrice>{plan.price}</PricingCard.MainPrice>
								<PricingCard.Period>{plan.period}</PricingCard.Period>
								{plan.original && (
									<PricingCard.OriginalPrice className="ml-auto">
										{plan.original}
									</PricingCard.OriginalPrice>
								)}
							</PricingCard.Price>
							<Button
								className={cn("w-full font-semibold")}
								variant={plan.variant as "outline" | "default"}
							>
								Get Started
							</Button>
						</PricingCard.Header>

						<PricingCard.Body>
							<PricingCard.Description>
								{plan.description}
							</PricingCard.Description>
							<PricingCard.List>
								{plan.features.map((item) => (
									<PricingCard.ListItem className="text-xs" key={item}>
										<CheckCircle2 aria-hidden="true" className="size-4 text-foreground" />
										<span>{item}</span>
									</PricingCard.ListItem>
								))}
							</PricingCard.List>
						</PricingCard.Body>
					</PricingCard.Card>
				))}
			</div>
		</section>
	);
}

const plans = [
	{
		icon: <Users />,
		description: "Get your fleet online",
		name: "Free",
		price: "Free",
		variant: "outline",
		features: [
			"Up to 5 vehicles",
			"Up to 5 staff members",
			"Up to 5 clients",
			"1 workspace",
			"Fleet & rental tracking",
			"Staff management",
		],
	},
	{
		icon: <Briefcase />,
		description: "For growing rental businesses",
		name: "Pro",
		badge: "Popular",
		price: "KES 2,500",
		original: "KES 3,500",
		period: "/month",
		variant: "default",
		features: [
			"Unlimited vehicles",
			"Unlimited staff members",
			"Unlimited clients",
			"Contracts & check-in / check-out",
			"Complaints & incident log",
			"Priority support",
		],
	},
	{
		icon: <Building />,
		name: "Business",
		description: "For multi-branch operators",
		price: "KES 6,000",
		original: "KES 8,000",
		period: "/month",
		variant: "outline",
		features: [
			"Everything in Pro",
			"Multiple workspaces",
			"Advanced reporting",
			"Data export",
			"Dedicated support",
			"Custom onboarding",
		],
	},
];
