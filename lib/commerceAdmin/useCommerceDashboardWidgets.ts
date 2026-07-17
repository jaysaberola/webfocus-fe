import { useEffect, useState } from "react";
import {
  COMMERCE_DASHBOARD_WIDGETS,
  CommerceDashboardWidgetId,
  DEFAULT_VISIBLE_WIDGETS,
  readVisibleDashboardWidgets,
  writeVisibleDashboardWidgets,
} from "@/lib/commerceAdmin/dashboardWidgets";

export function useCommerceDashboardWidgets() {
  const [visibleWidgets, setVisibleWidgets] = useState<CommerceDashboardWidgetId[]>(DEFAULT_VISIBLE_WIDGETS);

  useEffect(() => {
    setVisibleWidgets(readVisibleDashboardWidgets());
  }, []);

  const toggleWidget = (id: CommerceDashboardWidgetId) => {
    setVisibleWidgets((current) => {
      const next = current.includes(id)
        ? current.filter((widgetId) => widgetId !== id)
        : [...current, id];
      writeVisibleDashboardWidgets(next);
      return next;
    });
  };

  const resetWidgets = () => {
    writeVisibleDashboardWidgets(DEFAULT_VISIBLE_WIDGETS);
    setVisibleWidgets(DEFAULT_VISIBLE_WIDGETS);
  };

  const isVisible = (id: CommerceDashboardWidgetId) => visibleWidgets.includes(id);

  return {
    visibleWidgets,
    visibleCount: visibleWidgets.length,
    totalCount: COMMERCE_DASHBOARD_WIDGETS.length,
    toggleWidget,
    resetWidgets,
    isVisible,
  };
}
