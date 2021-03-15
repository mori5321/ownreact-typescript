// https://pomb.us/build-your-own-react/
// https://github.com/embarrassedmilk/didact-typescript
// https://github.com/ofk/didact-typescript
//
// https://typescript-jp.gitbook.io/deep-dive/tsx/others
//
// Next: Step V render and commit phase.

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

type DidactFiber = {
  dom: HTMLElement | Text | null;
  parent?: DidactFiber;
  child?: DidactFiber;
  sibling?: DidactFiber;
} & DidactElement;

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

const createDOM = (fiber: DidactFiber) => {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key: string) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      ((dom as unknown) as Record<string, unknown>)[name] = element.props[name];
    });

  return dom;
};

const render = (
  element: DidactElement,
  container: HTMLElement | Text
): void => {
  nextUnitOfWork = {
    dom: container,
    type: "",
    props: {
      children: [element],
    },
  };
};

// const render = (
//   element: DidactElement,
//   container: HTMLElement | Text
// ): void => {
//   const dom =
//     element.type === "TEXT_ELEMENT"
//       ? document.createTextNode("")
//       : document.createElement(element.type);
//
//   // id とか class とかのHTML attributeをDOMに付与する処理だと思うたぶん
//   const isProperty = (key: string) => key !== "children";
//   Object.keys(element.props)
//     .filter(isProperty)
//     .forEach((name) => {
//       ((dom as unknown) as Record<string, unknown>)[name] = element.props[name];
//     });
//   element.props.children.forEach((child) => render(child, dom));
//
//   container.appendChild(dom);
// };

let nextUnitOfWork: DidactFiber | null = null;

const performUnitOfWork = (fiber: DidactFiber): DidactFiber | null => {
  // TODO add dom node
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber);
  }

  if (fiber.parent && fiber.parent.dom) {
    fiber.parent.dom.appendChild(fiber.dom);
  }

  const elements = fiber.props.children;
  let index = 0;
  let prevSibling: any = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber: DidactFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: DidactFiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent ?? null;
  }

  // 仮置き
  return nextFiber;
  // TODO return next unit of work
};

const workLoop = (deadline: IdleDeadline): void => {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  shouldYield = deadline.timeRemaining() < 1;

  requestIdleCallback(workLoop);
};

requestIdleCallback(workLoop);

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
