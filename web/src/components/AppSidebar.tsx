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
      <div className="sider-title">珞珈优选</div>

      <nav className="sider-nav">
        <button
          className={activeTab === "market" ? "menu active" : "menu"}
          onClick={() => onTabChange("market")}
        >
          商品广场
        </button>

        <button
          className={activeTab === "cart" ? "menu active" : "menu"}
          onClick={() => onTabChange("cart")}
        >
          我的收藏
        </button>

        <button
          className={activeTab === "messages" ? "menu active" : "menu"}
          onClick={onOpenMessages}
        >
          消息{conversationsCount > 0 && `(${conversationsCount})`}
          {hasUnreadMessages && <span className="dot" />}
        </button>

        <button
          className={activeTab === "profile" ? "menu active" : "menu"}
          onClick={() => onTabChange("profile")}
        >
          个人中心
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
      </nav>

      <div className="sider-cta">
        <button
          className={
            activeTab === "publish" ? "cta-button active" : "cta-button"
          }
          onClick={() => onTabChange("publish")}
        >
          发布商品
        </button>
      </div>
    </aside>
  );
}
