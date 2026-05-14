import React from "react";
import styled from "styled-components";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { Navigate, Route, Routes } from "react-router-dom";

const Wrapper = styled("div")({
  height: "100%",
  display: "flex",
  flexDirection: "column",
});

const client = new ApolloClient({
  // uri: `${process.env.REACT_APP_SERVER_URL}` || "http://localhost:4000/graphql",
  uri: "http://localhost:4000/graphql",
  cache: new InMemoryCache(),
});

const App: React.FC = () => {
  return (
    <Wrapper>
      <ApolloProvider client={client}>
      <>hello world</>
      </ApolloProvider>
    </Wrapper>
  );
};

export default App;
