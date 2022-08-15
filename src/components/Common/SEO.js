import { Helmet } from "react-helmet";

function SEO(props) {
  const { children, ...customMeta } = props;
  const meta = {
    title: "Perpetual Swaps",
    description: `Trade spot or perpetual BTC, ETH and other top cryptocurrencies with up to 30x leverage directly from your wallet on Arbitrum.`,
    type: "exchange",
    ...customMeta,
  };
  const defaultImage = "https://swaps.mycelium.xyz/preview.png";
  const image = meta.image || defaultImage;
  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="robots" content="follow, index" />
        <meta name="description" content={meta.description} />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content="Mycelium Perpetual Swaps" />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@mycelium_eth" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={image} />
      </Helmet>
      {children}
    </>
  );
}

export default SEO;
