export const publicLineConfig = {
  liffId: process.env.NEXT_PUBLIC_LIFF_ID ?? process.env.NEXT_PUBLIC_LINE_LIFF_ID ?? '',
  channelId: process.env.NEXT_PUBLIC_LINE_CHANNEL_ID ?? process.env.NEXT_PUBLIC_LINE_CLIENT_ID ?? '',
  liffUrl:
    process.env.NEXT_PUBLIC_LIFF_URL ??
    ((process.env.NEXT_PUBLIC_LIFF_ID ?? process.env.NEXT_PUBLIC_LINE_LIFF_ID)
      ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID ?? process.env.NEXT_PUBLIC_LINE_LIFF_ID}`
      : ''),
  enableDevLogin: process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'
};

export const hasLineClientConfig = () => Boolean(publicLineConfig.liffId && publicLineConfig.channelId);
