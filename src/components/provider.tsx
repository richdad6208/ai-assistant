import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";

export default function Provider({ children }: any) {
  return (
    <MantineProvider>
      <Notifications position="top-right" className="w-[400px]" />
      {children}
    </MantineProvider>
  );
}
