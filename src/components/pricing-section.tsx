import Link from "next/link";
import { cn } from "@/lib/utils/index";
import { Button } from "@/components/ui/button";
import * as PricingCard from "@/components/pricing-card";
import { CheckCircle2, Users, Briefcase, Building, BadgeCheck } from "lucide-react";
import type { OrgPlan } from "@/lib/limits";

export function PricingSection({
	orgId,
	currentPlan = "FREE",
}: {
	orgId?: string;
	currentPlan?: OrgPlan;
}) {
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
					You&apos;re on the{" "}
					<span className="font-semibold text-foreground">
						{currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()}
					</span>{" "}
					plan. Upgrade any time — everything below unlocks instantly.
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
							{plan.id === currentPlan ? (
								<Button className="w-full font-semibold" variant="outline" disabled>
									<BadgeCheck className="size-4" />
									Current plan
								</Button>
							) : plan.id === "FREE" ? (
								<Button className="w-full font-semibold" variant="outline" disabled>
									Starter plan
								</Button>
							) : (
								<Button
									asChild
									className={cn("w-full font-semibold")}
									variant={plan.variant as "outline" | "default"}
								>
									<Link
										href={
											orgId
												? `/workspace/${orgId}/pricing/checkout?plan=${plan.id.toLowerCase()}`
												: "#"
										}
									>
										Upgrade to {plan.name}
									</Link>
								</Button>
							)}
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
		id: "FREE" as const,
		icon: <Users />,
		description: "Get your fleet online",
		name: "Free",
		price: "Free",
		variant: "outline",
		features: [
			"Up to 5 vehicles",
			"Up to 5 staff members",
			"Up to 5 clients",
			"Up to 5 rentals",
			"1 workspace",
			"Fleet & rental tracking",
			"Staff management",
		],
	},
	{
		id: "PRO" as const,
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
			"Unlimited clients & rentals",
			"Contracts & check-in / check-out",
			"Complaints & incident log",
			"Priority support",
		],
	},
	{
		id: "BUSINESS" as const,
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
