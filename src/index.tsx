// https://pomb.us/build-your-own-react/
// https://github.com/embarrassedmilk/didact-typescript
// https://github.com/ofk/didact-typescript
//
// https://typescript-jp.gitbook.io/deep-dive/tsx/others

declare namespace JSX {
  interface IntrinsicElements {
    div: HTMLAttributes<HTMLDivElement>;
    a: HTMLAttributes<HTMLAnchorElement>;
    p: HTMLAttributes<HTMLParagraphElement>;
    h1: HTMLAttributes<HTMLHeadingElement>;
  }
}

type DOMAttributes = {
  onClick?: () => void;
  children?: DidactNode;
};

type HTMLAttributes<T> = Partial<Omit<T, keyof DOMAttributes>> & DOMAttributes;

// Record<string, unknown> は id="foo"とかclass="hello"とかを表してる? たぶん。
// type DidactElement<T = undefined> = {
type DidactElement<T = string> = {
  type: T;
  props: Record<string, unknown> & {
    children: DidactElement[];
  };
};
type DidactNode = DidactElement | string;

const createElement = <T extends string>(
  type: T,
  props: Record<string, unknown>,
  ...children: DidactNode[]
): DidactElement<T> => ({
  type,
  props: {
    ...props,
    children: children.map((child) =>
      typeof child === "object" ? child : createTextElement(child)
    ),
  },
});

const createTextElement = (text: string): DidactElement<string> => ({
  type: "TEXT_ELEMENT",
  props: {
    nodeValue: text,
    children: [],
  },
});

const render = (
  element: DidactElement,
  container: HTMLElement | Text
): void => {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  // id とか class とかのHTML attributeをDOMに付与する処理だと思うたぶん
  const isProperty = (key: string) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      ((dom as unknown) as Record<string, unknown>)[name] = element.props[name];
    });
  element.props.children.forEach((child) => render(child, dom));

  container.appendChild(dom);
};

const Didact = {
  createElement,
  render,
};

const element: DidactElement = (
  <div id="foo">
    <p>Hello World. This is Tom. Yeah</p>
  </div>
);
const container = document.getElementById("root")!;

Didact.render(element, container);
