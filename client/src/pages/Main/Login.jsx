/** @jsx jsx */
import { jsx } from "theme-ui";
import { toast } from "react-toastify";
import {
  Button,
  Form,
  Grid,
  Header,
  Image,
  Message,
  Dimmer,
  Loader,
} from "semantic-ui-react";
import camel from "../../svg/camel.svg";

import { useDispatch, useSelector } from "react-redux";
import { login } from "../../store";
import { useEffect, useState } from "react";
import { Title, Toast } from "../../components";
import { useHistory, useParams } from "react-router-dom";

export default () => {
  const userId = useParams().userId || "";
  const dispatch = useDispatch();
  const history = useHistory();
  const auth = useSelector(state => state.auth);
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    if (auth.error) {
      toast.error(
        <Toast
          title="Couldn't login."
          message={auth.error.data}
          technical={auth.error.message}
        />
      );
    }
  }, [auth.error]);

  useEffect(() => {
    if (auth.token) {
      history.push("/editor");
    }
  }, [auth.token, history]);

  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");
    const password = formData.get("password");
    const useCookie = remember === true;
    dispatch(login(username, password, useCookie));
  };
  return (
    <Grid verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Title>Login</Title>
        <Header as="h2" textAlign="center">
          <Image src={camel} /> Log in to your account
        </Header>
        <br />
        <Form size="large" onSubmit={handleSubmit}>
          <Form.Input
            name="username"
            fluid
            icon="user"
            iconPosition="left"
            placeholder="Username / Email address"
            defaultValue={userId}
          />
          <Form.Input
            name="password"
            fluid
            icon="lock"
            iconPosition="left"
            placeholder="Password"
            type="password"
          />
          <Form.Checkbox
            label="Remember me"
            defaultChecked
            onClick={() => setRemember(!remember)}
          />
          <Button fluid size="large" type="submit">
            Login
          </Button>
        </Form>
        <Message positive>
          Don't have an account? <a href="/signup">Sign up now!</a>
        </Message>
        <Dimmer inverted active={auth.loading}>
          <Loader inverted>Logging in...</Loader>
        </Dimmer>
      </Grid.Column>
    </Grid>
  );
};
