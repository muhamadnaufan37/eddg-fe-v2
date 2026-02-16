import { getLocalStorage } from "@/services/localStorageService";
import { menuItems } from "@/utils/menuItems";
import React, { useEffect, useState } from "react";
import { isBrowser, isMobile } from "react-device-detect";
import LogoutModal from "./Sidebar/LogoutModal";
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Moon,
  Sun,
  LogOut,
  Home,
  Target,
  Users,
  Settings,
  FileText,
  BarChart,
  KeyRound,
  UserCog,
  ShieldHalf,
  MonitorCog,
  Route,
  Server,
  Database,
  Container,
  Repeat2,
  MailWarning,
  ScanQrCode,
  BicepsFlexed,
  CheckCheckIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { THEME_COLORS } from "@/config/theme";

type TLayoutProps = {
  children: React.ReactNode;
  fullScreen?: boolean;
};

type MenuItem = {
  id?: string;
  title: string;
  icon: React.ReactNode | string;
  role: string[];
  link?: string;
  submenu?: MenuItem[];
};

const Layout: React.FC<TLayoutProps> = ({ children, fullScreen = false }) => {
  const [itemsMenu, setItemsMenu] = useState<MenuItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarModalOpen, setIsSidebarModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<{
    [key: string]: boolean;
  }>({});
  const { theme, setTheme } = useTheme();

  const getIconComponent = (iconName: string | React.ReactNode) => {
    if (typeof iconName !== "string") return iconName;

    const iconMap: { [key: string]: React.ReactNode } = {
      Home: <Home size={20} />,
      Target: <Target size={20} />,
      Users: <Users size={20} />,
      Settings: <Settings size={20} />,
      FileText: <FileText size={20} />,
      BarChart: <BarChart size={20} />,
      KeyRound: <KeyRound size={20} />,
      UserCog: <UserCog size={20} />,
      ShieldHalf: <ShieldHalf size={20} />,
      MonitorCog: <MonitorCog size={20} />,
      Route: <Route size={20} />,
      Server: <Server size={20} />,
      Database: <Database size={20} />,
      Container: <Container size={20} />,
      Repeat2: <Repeat2 size={20} />,
      ScanQrCode: <ScanQrCode size={20} />,
      MailWarning: <MailWarning size={20} />,
      BicepsFlexed: <BicepsFlexed size={20} />,
      CheckCheckIcon: <CheckCheckIcon size={20} />,
    };

    return iconMap[iconName] || iconName;
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId],
    }));
  };

  const renderMenuItem = (item: MenuItem, depth: number = 0) => {
    // Check if user has permission to see this menu item
    if (!item.role.includes(role)) {
      return null;
    }

    const isActive = location.pathname === item.link;
    const isExpanded = expandedMenus[item.id || ""];
    // Filter submenu items by role
    const filteredSubmenu =
      item.submenu?.filter((subItem) => subItem.role.includes(role)) || [];
    const hasSubmenu = filteredSubmenu.length > 0;

    return (
      <div key={item.id} className="w-full">
        {hasSubmenu ? (
          <button
            onClick={() => toggleMenu(item.id || "")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              depth > 0 ? "pl-8" : ""
            } ${
              isExpanded
                ? `${THEME_COLORS.active.background} ${THEME_COLORS.active.text} shadow-lg font-semibold`
                : `${THEME_COLORS.text.secondary} ${THEME_COLORS.hover.item}`
            }`}
          >
            {typeof item.icon === "string" ? (
              item.icon.endsWith(".svg") || item.icon.endsWith(".png") ? (
                <img
                  className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
                  src={`/assets/icons/${item.icon}`}
                  alt={item.title}
                />
              ) : item.icon.startsWith("pi ") ? (
                <i
                  className={`${item.icon} text-lg shrink-0 transition-transform duration-300 group-hover:scale-110`}
                />
              ) : (
                <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                  {getIconComponent(item.icon)}
                </span>
              )
            ) : (
              <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </span>
            )}
            <span className="whitespace-nowrap font-medium">{item.title}</span>
            <div className="ml-auto">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 transition-transform duration-300" />
              ) : (
                <ChevronRight className="h-4 w-4 transition-transform duration-300" />
              )}
            </div>
          </button>
        ) : (
          <a
            href={item.link}
            onClick={handleCloseSidebar}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              depth > 0 ? "pl-8" : ""
            } ${
              isActive
                ? `${THEME_COLORS.active.background} ${THEME_COLORS.active.text} shadow-lg font-semibold`
                : `${THEME_COLORS.text.secondary} ${THEME_COLORS.hover.item}`
            }`}
          >
            {typeof item.icon === "string" ? (
              item.icon.endsWith(".svg") || item.icon.endsWith(".png") ? (
                <img
                  className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
                  src={`/assets/icons/${item.icon}`}
                  alt={item.title}
                />
              ) : item.icon.startsWith("pi ") ? (
                <i
                  className={`${item.icon} text-lg shrink-0 transition-transform duration-300 group-hover:scale-110`}
                />
              ) : (
                <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                  {getIconComponent(item.icon)}
                </span>
              )
            ) : (
              <span className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </span>
            )}
            <span className="whitespace-nowrap font-medium">{item.title}</span>
            {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
          </a>
        )}
        {hasSubmenu && isExpanded && (
          <div className="mt-2 space-y-2 ml-4">
            {filteredSubmenu.map((subItem) =>
              renderMenuItem(subItem, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  };

  const handleOpenSidebar = () => {
    setIsSidebarModalOpen(true);
    setTimeout(() => {
      setIsOpening(true);
    }, 10);
  };

  const handleCloseSidebar = () => {
    setIsClosing(true);
    setIsOpening(false);
    setTimeout(() => {
      setIsSidebarModalOpen(false);
      setIsClosing(false);
    }, 300);
  };

  const userData = getLocalStorage("userData");

  const whatRole = () => {
    switch (userData?.user?.role_id) {
      case "219bc0dd-ec72-4618-b22d-5d5ff612dcaf":
        return "admin";
      case "aba1b06f-846a-414b-b223-b002a50c5722":
        return "ptgs-sensus";
      case "b7721c02-96f7-4238-bc7e-1bcf2e0ebd56":
        return "bendahara";
      case "e2896d58-4831-458c-9fb7-c4f988c0550c":
        return "admin-kbm";
      case "7352e0d6-f5d0-45f2-8eb4-4880cc72bad6":
        return "admin-data-center";
      case "e405d388-541b-487b-87d4-cb0b294cfc11":
        return "pengurus";
      case "b511748b-ef40-4999-b4e9-b8ab575ec958":
        return "ptgs-absen";
      default:
        return "all";
    }
  };

  const role = whatRole();

  const generateItemsMenu = () => {
    const filteredItems = menuItems.filter((item: MenuItem) => {
      return item.role.includes(role);
    });

    setItemsMenu(filteredItems);
  };

  // const BottomNavigation = () => {
  //   return (
  //     <div
  //       className={`fixed bottom-0 left-0 right-0 ${THEME_COLORS.background.card} border-t ${THEME_COLORS.border.default} transition-colors duration-300 shadow-lg z-50`}
  //     >
  //       <div className="flex justify-around items-center h-16 px-2">
  //         {itemsMenu.map((item: MenuItem) => {
  //           const isActive = location.pathname === item.link;

  //           return (
  //             <a
  //               key={item.id}
  //               href={item.link}
  //               title={item.title || item.id}
  //               className={`transition-all duration-300 transform hover:scale-110 relative group
  //               ${
  //                 isActive
  //                   ? "text-green-600 dark:text-green-400 scale-110"
  //                   : `${THEME_COLORS.text.muted} hover:text-green-600 dark:hover:text-green-400`
  //               }
  //             `}
  //             >
  //               {typeof item.icon === "string" ? (
  //                 item.icon.endsWith(".svg") || item.icon.endsWith(".png") ? (
  //                   <img
  //                     className="h-6 w-6"
  //                     src={`/assets/icons/${item.icon}`}
  //                     alt={item.title}
  //                   />
  //                 ) : item.icon.startsWith("pi ") ? (
  //                   <i className={`${item.icon} text-xl`} />
  //                 ) : (
  //                   <span className="flex items-center justify-center">
  //                     {getIconComponent(item.icon)}
  //                   </span>
  //                 )
  //               ) : (
  //                 <span className="flex items-center justify-center">
  //                   {item.icon}
  //                 </span>
  //               )}
  //               {isActive && (
  //                 <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></span>
  //               )}
  //             </a>
  //           );
  //         })}

  //         <a
  //           onClick={() => setIsModalOpen(true)}
  //           title="Logout"
  //           className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-all duration-300 hover:scale-110 cursor-pointer"
  //         >
  //           <i className="pi pi-sign-out text-xl" />
  //         </a>
  //       </div>
  //     </div>
  //   );
  // };

  useEffect(() => {
    generateItemsMenu();
  }, [role, isBrowser, isMobile]);

  return (
    <>
      {/* SIDEBAR MODAL untuk Desktop */}
      {isBrowser && isSidebarModalOpen && (
        <>
          {/* Overlay */}
          <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-60 transition-all duration-300 ease-in-out ${
              isOpening && !isClosing ? "opacity-100" : "opacity-0"
            }`}
            onClick={handleCloseSidebar}
          />

          {/* Modal Sidebar */}
          <div
            className={`fixed top-0 left-0 h-screen w-80 ${THEME_COLORS.background.primary} shadow-2xl flex flex-col py-6 z-70 transition-all duration-300 ease-in-out border-r ${THEME_COLORS.border.default} rounded-r-4xl ${
              isOpening && !isClosing
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-0"
            }`}
          >
            {/* Header dengan close button */}
            <div className="px-4 shrink-0">
              <div className="flex items-center justify-between mb-6">
                <a href="/" className="flex items-center gap-3">
                  <img
                    width="32"
                    src="/logo.svg"
                    alt="logo"
                    className="select-none"
                  />
                  <span
                    className={`font-bold text-xl ${THEME_COLORS.text.primary}`}
                  >
                    Digitaldatagenerus
                  </span>
                </a>
                <button
                  onClick={handleCloseSidebar}
                  className={`p-2 ${THEME_COLORS.hover.item} rounded-lg transition-all duration-300 hover:rotate-90`}
                  aria-label="Close sidebar"
                >
                  <X className={`h-5 w-5 ${THEME_COLORS.text.muted}`} />
                </button>
              </div>
            </div>

            {/* MENU ITEMS */}
            <div className="flex-1 overflow-y-auto px-4 min-h-0">
              <div className="flex flex-col items-start gap-4 w-full pb-4">
                {itemsMenu.map((item: MenuItem) => renderMenuItem(item))}
              </div>
            </div>

            {/* BOTTOM MENU */}
            <div className="px-4 shrink-0">
              <div
                className={`border-t ${THEME_COLORS.border.default} pt-3 flex flex-col gap-2`}
              >
                <button
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${THEME_COLORS.text.muted} ${THEME_COLORS.hover.item} transition-all duration-300 group`}
                >
                  <i className="pi pi-bookmark text-lg transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm font-medium">Panduan</span>
                </button>
                <button
                  onClick={() => {
                    handleCloseSidebar();
                    setTimeout(() => setIsModalOpen(true), 300);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 group"
                >
                  <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* HEADER */}
      {isBrowser && (
        <div
          className={`fixed left-0 right-0 top-0 h-14 ${THEME_COLORS.background.card} shadow-md z-40 transition-colors duration-300 border-b ${THEME_COLORS.border.default} ${
            fullScreen ? "" : ""
          }`}
        >
          <div className="h-full flex items-center justify-between px-4">
            {/* Left side - Menu button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenSidebar}
                className={`p-2 ${THEME_COLORS.hover.item} rounded-lg transition-all duration-300 group`}
                aria-label="Open menu"
              >
                <Menu
                  className={`h-5 w-5 ${THEME_COLORS.text.secondary} group-hover:scale-110 transition-transform`}
                />
              </button>
            </div>

            {/* Right side - Dark mode toggle & Profile */}
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`p-2 ${THEME_COLORS.hover.item} rounded-lg transition-all duration-300 group`}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-yellow-500 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Moon
                    className={`h-5 w-5 ${THEME_COLORS.text.secondary} group-hover:rotate-12 transition-transform duration-300`}
                  />
                )}
              </button>

              <div className="flex items-center gap-2">
                {/* PROFILE IMAGE */}
                <img
                  src="/user.svg"
                  className={`rounded-md h-7 w-7 object-cover ring-2 ${THEME_COLORS.border.default} transition-all duration-300`}
                  alt="Profile"
                />

                {/* NAME + ROLE */}
                <div className="flex flex-col leading-tight">
                  <span
                    className={`font-semibold text-sm ${THEME_COLORS.text.primary} transition-colors duration-300`}
                  >
                    {userData?.user?.nama_lengkap || ""}
                  </span>
                  <span
                    className={`text-sm ${THEME_COLORS.text.muted} -mt-1 transition-colors duration-300`}
                  >
                    {userData?.user?.nm_role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header & Bottom Navigation */}
      {isMobile && (
        <>
          {/* Mobile Header */}
          <div
            className={`fixed top-0 left-0 right-0 h-14 ${THEME_COLORS.background.card} shadow-sm z-40 transition-colors duration-300 border-b ${THEME_COLORS.border.default}`}
          >
            <div className="h-full flex items-center justify-between px-4">
              {/* Menu button */}
              <button
                onClick={handleOpenSidebar}
                className={`p-2 ${THEME_COLORS.hover.item} rounded-lg transition-all duration-300`}
              >
                <Menu className={`h-5 w-5 ${THEME_COLORS.text.secondary}`} />
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={`p-2 ${THEME_COLORS.hover.item} rounded-lg transition-all duration-300`}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className={`h-5 w-5 ${THEME_COLORS.text.secondary}`} />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Sidebar Modal */}
          {isSidebarModalOpen && (
            <>
              <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-60 transition-all duration-300 ease-in-out ${
                  isOpening && !isClosing ? "opacity-100" : "opacity-0"
                }`}
                onClick={handleCloseSidebar}
              />
              <div
                className={`fixed top-0 left-0 h-screen w-80 ${THEME_COLORS.background.primary} shadow-2xl flex flex-col py-6 z-70 transition-all duration-300 ease-in-out border-r ${THEME_COLORS.border.default} rounded-r-4xl ${
                  isOpening && !isClosing
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-full opacity-0"
                }`}
              >
                <div className="px-4 shrink-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <img width="32" src="/logo.svg" alt="logo" />
                      <span
                        className={`font-bold text-xl ${THEME_COLORS.text.primary}`}
                      >
                        Digitaldatagenerus
                      </span>
                    </div>
                    <button
                      onClick={handleCloseSidebar}
                      className={`p-2 ${THEME_COLORS.hover.item} rounded-lg transition-all`}
                    >
                      <X className={`h-5 w-5 ${THEME_COLORS.text.muted}`} />
                    </button>
                  </div>
                </div>

                {/* Mobile Menu Items - Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 min-h-0">
                  <div className="flex flex-col gap-2 pb-4">
                    {itemsMenu.map((item: MenuItem) => renderMenuItem(item))}
                  </div>
                </div>

                <div className="px-4 shrink-0">
                  <div
                    className={`border-t ${THEME_COLORS.border.default} pt-3 flex flex-col gap-2`}
                  >
                    <button
                      className={`flex items-center gap-3 px-4 py-3 ${THEME_COLORS.text.muted} ${THEME_COLORS.hover.item} rounded-xl transition-all`}
                    >
                      <i className="pi pi-bookmark text-lg" />
                      <span className="font-medium">Panduan</span>
                    </button>
                    <button
                      onClick={() => {
                        handleCloseSidebar();
                        setTimeout(() => setIsModalOpen(true), 300);
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                      <i className="pi pi-sign-out text-lg" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* MAIN CONTENT */}
      {isBrowser && (
        <div
          className={`min-h-dvh overflow-auto ${THEME_COLORS.background.primary} relative transition-all duration-300 ${
            fullScreen ? "pt-0" : "pt-20 p-6"
          }`}
        >
          {children}
        </div>
      )}

      {isMobile && (
        <div
          className={`relative min-h-dvh w-full pt-20 ${THEME_COLORS.background.primary} transition-colors duration-300`}
        >
          <div className="h-full overflow-y-auto px-4 pb-5">{children}</div>
          {/* <BottomNavigation /> */}
        </div>
      )}

      <LogoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Layout;
