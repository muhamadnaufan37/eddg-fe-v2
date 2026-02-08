import { Link, useLocation } from "react-router-dom";

type MenuItem = {
  id: string;
  title: string;
  icon: string;
  role: string[];
  link: string;
};

type Props = {
  itemsMenu: MenuItem[];
  setIsModalOpen: (val: boolean) => void;
};

const BottomNavigation = ({ itemsMenu, setIsModalOpen }: Props) => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="flex justify-around items-center h-16 px-2">
        {itemsMenu.map((item) => {
          const isActive = location.pathname === item.link;

          return (
            <Link
              key={item.id}
              to={item.link}
              className="relative flex flex-col items-center justify-center w-full h-full transition-all duration-300"
            >
              {/* Icon */}
              <img
                src={item.icon}
                alt={item.title}
                className={`
                  w-6 h-6 transition-all duration-300
                  ${isActive ? "scale-110 text-blue-600" : "scale-100 opacity-70"}
                `}
              />

              {/* Label */}
              <span
                className={`
                  text-xs mt-1 transition-all duration-300
                  ${isActive ? "text-blue-600 dark:text-blue-400 font-medium" : "text-gray-500 dark:text-gray-400"}
                `}
              >
                {item.title}
              </span>

              {/* Active Indicator */}
              {isActive && (
                <span className="absolute -bottom-1 w-8 h-1 rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-300" />
              )}
            </Link>
          );
        })}

        {/* Logout */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300"
        >
          <i className="pi pi-sign-out text-lg" />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
