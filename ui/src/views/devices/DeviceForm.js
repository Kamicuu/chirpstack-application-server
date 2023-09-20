import React from "react";

import { withStyles } from "@material-ui/core/styles";
import TextField from '@material-ui/core/TextField';
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormLabel from "@material-ui/core/FormLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import Checkbox from "@material-ui/core/Checkbox";
import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Card from '@material-ui/core/Card';
import CardContent from "@material-ui/core/CardContent";
import FormGroup from "@material-ui/core/FormGroup";
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import Tooltip from '@material-ui/core/Tooltip';
import HelpCircleOutline from "mdi-material-ui/HelpCircleOutline";

import FormComponent from "../../classes/FormComponent";
import Form from "../../components/Form";
import KVForm from "../../components/KVForm";
import EUI64Field from "../../components/EUI64Field";
import AutocompleteSelect from "../../components/AutocompleteSelect";
import DeviceProfileStore from "../../stores/DeviceProfileStore";
import DeviceStore from "../../stores/DeviceStore";


const styles = {
  formLabel: {
    fontSize: 12,
  },
};


class DeviceForm extends FormComponent {
  constructor(props) {
    super(props);
    this.getDeviceProfileOption = this.getDeviceProfileOption.bind(this);
    this.getDeviceProfileOptions = this.getDeviceProfileOptions.bind(this);
    this.getExtraConfig = this.getExtraConfig.bind(this);
    this.submitChannelChange = this.submitChannelChange.bind(this);
    this.handleChannelErrorMessages = this.handleChannelErrorMessages.bind(this);

    this.state = {
      tab: 0,
      variables: [],
      tags: [],
      allChannels: 16,
      channelConfig: undefined,
      noChannelsSelectedError: false,
      defaultChannelsSelectedWarning: false,
    };
  }

  componentDidMount() {
    super.componentDidMount();

    this.setKVArrays(this.props.object || {});
    this.getExtraConfig()
  }

  componentDidUpdate(prevProps) {
    super.componentDidUpdate(prevProps);

    if (prevProps.object !== this.props.object) {
      this.setKVArrays(this.props.object || {});
    }
  }

  setKVArrays = (props) => {
    let variables = [];
    let tags = [];

    if (props.variables !== undefined) {
      for (let key in props.variables) {
        variables.push({key: key, value: props.variables[key]});
      }
    }

    if (props.tags !== undefined) {
      for (let key in props.tags) {
        tags.push({key: key, value: props.tags[key]});
      }
    }

    this.setState({
      variables: variables,
      tags: tags,
    });
  }

  getDeviceProfileOption(id, callbackFunc) {
    DeviceProfileStore.get(id, resp => {
      callbackFunc({label: resp.deviceProfile.name, value: resp.deviceProfile.id});
    });
  }

  getDeviceProfileOptions(search, callbackFunc) {
    DeviceProfileStore.list(0, this.props.match.params.applicationID, 999, 0, resp => {
      const options = resp.result.map((dp, i) => {return {label: dp.name, value: dp.id}});
      callbackFunc(options);
    });
  }

  getExtraConfig() {
    if(this.props.match.params.devEUI !== undefined)
    DeviceStore.getDeviceExtraConfigChannels(this.props.match.params.devEUI, resp => {
      this.setState({...this.state, channelConfig: resp}, ()=>this.handleChannelErrorMessages(resp));
    });
  }

  onTabChange = (e, v) => {
    this.setState({
      tab: v,
    });
  }

  changeChannelCheckbox = (e, v) => {
    let newChannelConfig;
    const channelNum = this.state.channelConfig.channels.find(ch => ch === parseInt(e.target.value))

    if (channelNum !== undefined && !v)
      newChannelConfig = {...this.state.channelConfig, channels: this.state.channelConfig.channels.filter(ch => ch !== parseInt(e.target.value))}
    else if (channelNum === undefined && v)
      newChannelConfig = {...this.state.channelConfig, channels: [...this.state.channelConfig.channels, parseInt(e.target.value)]}
    else 
      newChannelConfig = this.state.channelConfig

    this.setState({...this.state, channelConfig: newChannelConfig}, ()=>this.handleChannelErrorMessages(newChannelConfig));
  }

  handleChannelErrorMessages = (channelsConfig) =>{
    let showErrorMsg = false;
    let showWarningMsg = false;

    let defaultChannelsCount = channelsConfig?.channels?.reduce((acc, ch)=>(ch === 0 || ch === 1 || ch === 2) ? acc+1 : acc, 0);

    if(channelsConfig?.channels?.length === 0)
      showErrorMsg = true;
    else if(defaultChannelsCount < 3)
      showWarningMsg = true;
    
    this.setState({...this.state, noChannelsSelectedError: showErrorMsg, defaultChannelsSelectedWarning: showWarningMsg});
  }

  submitChannelChange = (e) => {
    let data = this.state.channelConfig;
    data.channels = data.channels.sort();

    if(data.channels.length === 0)
      return;
    
    DeviceStore.setDeviceExtraConfigChannels(data, resp => {
    });
  }
 
  render() {
    if (this.state.object === undefined) {
      return null;
    }

    const variables = this.state.variables.map((obj, i) => <KVForm key={i} index={i} object={obj} onChange={this.onChangeKV("variables")} onDelete={this.onDeleteKV("variables")} />);
    const tags = this.state.tags.map((obj, i) => <KVForm key={i} index={i} object={obj} onChange={this.onChangeKV("tags")} onDelete={this.onDeleteKV("tags")} />);
    const channelsWarningText = `Indeksy kanałów są zahardkodowane w interfejsie graficznym! Nie sa one pobierane z chirpstacka 
    - oznacza to że niezależnie czy mamy w głównym konfigu serwera zdefiniowane 8 kanałów, 5 czy tylko domyślne 3, tutaj zawsze będziemy widzieć 16 indeksów kanałów. Dlatego w przyszłości nalezy bardzo uważać na
     konfigurację globalną i wszelakie zmiany w postaci dodawania/usuwania kanałów w głównym konfigu serwera.
    `
    const allChannelsCheckboxes = [];
    for(let i=0; i<this.state.allChannels; i++){
      const id = `channel_checkbox_${i}`

      if(this.state.channelConfig !== undefined){
        allChannelsCheckboxes.push(
          <TableRow key={id}>
            <TableCell>Channel {i}</TableCell>
            <TableCell>
              <Checkbox
                id={id}
                checked={this.state.channelConfig.channels.find(ch => ch === i) !== undefined ? true : false}
                onChange={this.changeChannelCheckbox}
                color="primary"
                value={i}
              />
            </TableCell>
          </TableRow>
       )
      }
    }

    return(
      <Form
        submitLabel={this.props.submitLabel}
        onSubmit={(e)=>{this.onSubmit(e); this.submitChannelChange(e)}}
        disabled={this.props.disabled}
      >
        <Tabs value={this.state.tab} onChange={this.onTabChange} indicatorColor="primary">
          <Tab label="General" />
          <Tab label="Variables" />
          <Tab label="Tags" />
          <Tab label="Advanced config" />
        </Tabs>

        {this.state.tab === 0 && <div>
          <TextField
            id="name"
            label="Device name"
            helperText="The name may only contain words, numbers and dashes."
            margin="normal"
            value={this.state.object.name || ""}
            onChange={this.onChange}
            inputProps={{
              pattern: "[\\w-]+",
            }}
            fullWidth
            required
          />
          <TextField
            id="description"
            label="Device description"
            margin="normal"
            value={this.state.object.description || ""}
            onChange={this.onChange}
            fullWidth
            required
          />
          {!this.props.update && <EUI64Field
            margin="normal"
            id="devEUI"
            label="Device EUI"
            onChange={this.onChange}
            value={this.state.object.devEUI || ""}
            fullWidth
            required
            random
          />}
          <FormControl fullWidth margin="normal">
            <FormLabel className={this.props.classes.formLabel} required>Device-profile</FormLabel>
            <AutocompleteSelect
              id="deviceProfileID"
              label="Device-profile"
              value={this.state.object.deviceProfileID}
              onChange={this.onChange}
              getOption={this.getDeviceProfileOption}
              getOptions={this.getDeviceProfileOptions}
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <FormGroup>
              <FormControlLabel
                label="Disable frame-counter validation"
                control={
                  <Checkbox
                    id="skipFCntCheck"
                    checked={!!this.state.object.skipFCntCheck}
                    onChange={this.onChange}
                    color="primary"
                  />
                }
              />
            </FormGroup>
            <FormHelperText>
              Note that disabling the frame-counter validation will compromise security as it enables people to perform replay-attacks.
            </FormHelperText>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <FormGroup>
              <FormControlLabel
                label="Device is disabled"
                control={
                  <Checkbox
                    id="isDisabled"
                    checked={!!this.state.object.isDisabled}
                    onChange={this.onChange}
                    color="primary"
                  />
                }
              />
            </FormGroup>
            <FormHelperText>
              ChirpStack Network Server will ignore received uplink frames and join-requests from disabled devices.
            </FormHelperText>
          </FormControl>
        </div>}

        {this.state.tab === 1 && <div>
          <FormControl fullWidth margin="normal">
            <Typography variant="body1">
              Variables can be used to substitute placeholders in for example integrations, e.g. in case an integration requires the configuration of a device specific token.
            </Typography>
            {variables}
          </FormControl>
          <Button variant="outlined" onClick={this.addKV("variables")}>Add variable</Button>
        </div>}

        {this.state.tab === 2 && <div>
          <FormControl fullWidth margin="normal">
            <Typography variant="body1">
              Tags can be used as device filters and are exposed on events as additional meta-data for aggregation.
            </Typography>
            {tags}
          </FormControl>
          <Button variant="outlined" onClick={this.addKV("tags")}>Add tag</Button>
        </div>}

        {this.state.tab === 3 && <div>
          <FormControl fullWidth margin="normal">
            <Typography variant="body1">
              Advanced configurations - here we can set advanced LoRaWAN MAC settings per device.
            </Typography>
            <Grid item xs={8} style={{marginTop: '15px'}}>
            <Card className={this.props.classes.card} style={{maxWidth: '350px'}}>
              <CardContent>
                <Typography variant="subtitle2">
                <Tooltip title={channelsWarningText}>
                  <HelpCircleOutline className={this.props.classes.icon} style={{width: '18px', height: '18px', verticalAlign:'text-bottom'}}/>
                </Tooltip>
                <span style={{marginLeft: "0.5rem"}}>Enabled channels indexes:</span>
                </Typography>
                { allChannelsCheckboxes.length > 0 ? 
                  <Table  size="small" style={{maxWidth: '300px'}}>
                  <TableBody>
                    {allChannelsCheckboxes}
                  </TableBody>
                  </Table>
                :
                  <span style={{marginTop: "1rem", display:"block"}}>Not supported at this state.</span>
                }
                {this.state.noChannelsSelectedError ? 
                  <Typography style={{marginTop: "1rem", color:"red"}}>
                      Option will not be saved! You need to select at least one channel.
                  </Typography>
                :
                  null
                }
                {this.state.defaultChannelsSelectedWarning ? 
                  <Typography style={{marginTop: "1rem", color:"darkorange"}}>
                      You are modify one of default channels! This is not supported (unmodifiable) by LoRaWAN standard! Make sure that this device allows you to modify the default channels.
                  </Typography>
                :
                  null
                }
              </CardContent>
              </Card>
            </Grid>
          </FormControl>
        </div>}
      </Form>
    );
  }
}

export default withStyles(styles)(DeviceForm);
