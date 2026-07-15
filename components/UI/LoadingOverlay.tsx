interface Props {
  loading: boolean;
  text?: string;
}

export default function LoadingOverlay(_props: Props) {
  // Loading overlay disabled globally — accept props so consumers compile cleanly.
  return null;
}
