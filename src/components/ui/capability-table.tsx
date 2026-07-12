import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, CircleCheck, X } from "lucide-react";

const capabilities = [
  {
    capability: 'Workspaces',
    Free: '1',
    Growth: '3',
    Operations: 'Unlimited',
    Enterprise: 'Unlimited',
  },
  {
    capability: 'Team members',
    Free: '3',
    Growth: '10',
    Operations: 'Unlimited',
    Enterprise: 'Unlimited',
  },
  {
    capability: 'Pages',
    Free: '50',
    Growth: 'Unlimited',
    Operations: 'Unlimited',
    Enterprise: 'Unlimited',
  },
  { capability: 'Tools', Free: '5 max', Growth: 'All', Operations: 'All', Enterprise: 'All' },
  { capability: 'Blackboard', Free: true, Growth: true, Operations: true, Enterprise: true },
  { capability: 'System pages', Free: true, Growth: true, Operations: true, Enterprise: true },
  { capability: 'Real email inbox', Free: false, Growth: true, Operations: true, Enterprise: true },
  { capability: 'AI suggestions', Free: true, Growth: true, Operations: true, Enterprise: true },
  { capability: 'AI actions', Free: false, Growth: false, Operations: true, Enterprise: true },
  {
    capability: 'Workspace Director',
    Free: false,
    Growth: false,
    Operations: true,
    Enterprise: true,
  },
  { capability: 'Analytics', Free: false, Growth: true, Operations: true, Enterprise: true },
  {
    capability: 'Role-based access',
    Free: false,
    Growth: false,
    Operations: true,
    Enterprise: true,
  },
  { capability: 'Custom branding', Free: false, Growth: false, Operations: true, Enterprise: true },
  { capability: 'Audit logs', Free: false, Growth: false, Operations: true, Enterprise: true },
  {
    capability: 'Custom AI rules',
    Free: false,
    Growth: false,
    Operations: false,
    Enterprise: true,
  },
  {
    capability: 'Dedicated infra',
    Free: false,
    Growth: false,
    Operations: false,
    Enterprise: true,
  },
  { capability: 'On-prem option', Free: false, Growth: false, Operations: false, Enterprise: true },
];

const plans = ['Free', 'Growth', 'Operations', 'Enterprise'];
export function CapabilityTable() {
  return (
    <Table className="min-w-full  text-sm">
      <TableHeader>
        <TableRow>
          <TableHead className="text-xl gradient-text border-0">Capability</TableHead>
          {plans.map((plan) => (
            <TableHead key={plan} className="border-0 text-lg text-center">
              {plan}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {capabilities.map((row) => (
          <TableRow key={row.capability}>
            <TableCell className="text-md border-0">{row.capability}</TableCell>
            {plans.map((plan) => (
              <TableCell key={plan} className="text-center border-0">
                {typeof row[plan] === "boolean" ? (
                  row[plan] ? (
                    <CircleCheck className="mx-auto size-4 text-green-400" />
                  ) : (
                    <X className="mx-auto text-pink-500" />
                  )
                ) : (
                  <span>{row[plan]}</span>
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
