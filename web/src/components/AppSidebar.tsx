import type { Tab, User } from "../types";

type Props = {
  user: User;
  activeTab: Tab;
  conversationsCount: number;
  hasUnreadMessages: boolean;
  onTabChange: (tab: Tab) => void;
  onOpenMessages: () => void;
};

export function AppSidebar({
  user,
  activeTab,
  conversationsCount,
  hasUnreadMessages,
  onTabChange,
  onOpenMessages,
}: Props) {
  return (
    <aside className="sider">
      <h2>Campus Market</h2>
      <button
        className={activeTab === "market" ? "menu active" : "menu"}
        onClick={() => onTabChange("market")}
      >
        商品展示
      </button>
      <button
        className={activeTab === "favorites" ? "menu active" : "menu"}
        onClick={() => onTabChange("favorites")}
      >
        我的收藏
      </button>
      <button
        className={activeTab === "cart" ? "menu active" : "menu"}
        onClick={() => onTabChange("cart")}
      >
        购物车
      </button>
      <button
        className={activeTab === "messages" ? "menu active" : "menu"}
        onClick={onOpenMessages}
      >
        消息{conversationsCount > 0 && `(${conversationsCount})`}
        {hasUnreadMessages && <span className="dot" />}
      </button>
      <button
        className={activeTab === "mine" ? "menu active" : "menu"}
        onClick={() => onTabChange("mine")}
      >
        发布/我的商品
      </button>
      {user.role === "admin" && (
        <button
          className={activeTab === "manage" ? "menu active" : "menu"}
          onClick={() => onTabChange("manage")}
        >
          审核管理
        </button>
      )}
      {user.role === "admin" && (
        <button
          className={activeTab === "accounts" ? "menu active" : "menu"}
          onClick={() => onTabChange("accounts")}
        >
          账号管理
        </button>
      )}
    </aside>
  );
}
