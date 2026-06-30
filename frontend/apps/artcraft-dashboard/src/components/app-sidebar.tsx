import * as React from "react";
import {
  IconBrandStripe,
  IconBriefcase,
  IconBug,
  IconCamera,
  IconCompass,
  IconCreditCard,
  IconFlag,
  IconKey,
  IconClipboardList,
  IconCoin,
  IconHeartHandshake,
  IconMail,
  IconBellRinging,
  IconFileAi,
  IconFileDescription,
  IconSettings,
  IconShare,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
//import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { SettingsDialog } from "@/components/settings-dialog";
import artcraftIcon from "@/assets/artcraft-icon.svg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";

const data = {
  navGroups: [
    {
      label: "Media",
      items: [
        { title: "Explore Media", url: "/explore/media", icon: IconCompass },
      ],
    },
    {
      label: "Users",
      items: [
        { title: "User Search", url: "/user/search", icon: IconUsers },
        { title: "Stripe Lookup", url: "/stripe-lookup", icon: IconBrandStripe },
      ],
    },
    {
      label: "User Growth",
      items: [
        { title: "User Signups", url: "/user-signups", icon: IconUserPlus },
        { title: "Subscriber Signups", url: "/subscriber-signups", icon: IconCreditCard },
        { title: "Referrals", url: "/referrals", icon: IconShare },
      ],
    },
    {
      label: "Business Growth",
      items: [
        { title: "Spend Events", url: "/spend-events", icon: IconCoin },
        { title: "Reengagement List", url: "/reengagement-list", icon: IconHeartHandshake },
      ],
    },
    {
      label: "Oncall",
      items: [
        { title: "Page Oncall", url: "/send-pager", icon: IconBellRinging },
        { title: "Search Job by Token", url: "/moderation/job-search", icon: IconBriefcase },
        { title: "Search Debug Logs", url: "/moderation/debug-logs-search", icon: IconBug },
        { title: "Impersonation Logs", url: "/impersonation", icon: IconKey },
        { title: "Staff Audit Logs", url: "/staff-audit-logs", icon: IconClipboardList },
        { title: "Feature Flags", url: "/feature-flags", icon: IconFlag },
        { title: "Email Changes", url: "/email-changes", icon: IconMail },
      ],
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
  // documents: [
  //   {
  //     name: "Data Library",
  //     url: "#",
  //     icon: IconDatabase,
  //   },
  //   {
  //     name: "Reports",
  //     url: "#",
  //     icon: IconReport,
  //   },
  //   {
  //     name: "Word Assistant",
  //     url: "#",
  //     icon: IconFileWord,
  //   },
  // ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const navSecondaryConfig = React.useMemo(
    () =>
      data.navSecondary.map((item) => {
        if (item.title === "Settings") {
          return {
            ...item,
            onClick: () => setSettingsOpen(true),
          };
        }
        return item;
      }),
    [],
  );

  return (
    <>
      <Sidebar collapsible="offcanvas" {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5! text-foreground"
              >
                <Link to="/">
                  <img
                    src={artcraftIcon}
                    className="size-5"
                    alt="Artcraft Icon"
                  />
                  <span className="text-[1.06rem] font-semibold font-outfit">
                    ArtCraft Admin
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {data.navGroups.map((group) => (
            <NavMain key={group.label} label={group.label} items={group.items} />
          ))}
          {/* <NavDocuments items={data.documents} /> */}
          <NavSecondary items={navSecondaryConfig} className="mt-auto" />
        </SidebarContent>
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </Sidebar>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
