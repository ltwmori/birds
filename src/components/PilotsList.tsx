import { useState, useEffect } from "react";
// import fetch from "isomorphic-fetch";
import './PilotsList.css';

require("isomorphic-fetch");

interface Pilot {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  pilotId: string;
  distance: number;
  createdDt: string;
}

interface Drone {
  position: [number, number];
  serial: string;
}

const PilotsList: React.FC = () => {
  const [pilots, setPilots] = useState<Pilot[]>([]);
  useEffect(() => {
    const getData = async () => {
      try {
        // Fetch drone positions
        const droneData = await fetch(
          "https://assignments.reaktor.com/birdnest/drones"
        );
        const droneXML = await droneData.text();

        // Parse XML data
        const parser = new DOMParser();
        const xml = parser.parseFromString(droneXML, "text/xml");

        // Extract drone information
        const drones: Drone[] = [];
        const droneNodes = xml.getElementsByTagName("drone");
        for (let i = 0; i < droneNodes.length; i++) {
          const positionXNode =
            droneNodes[i].getElementsByTagName("positionX")[0];
          const positionYNode =
            droneNodes[i].getElementsByTagName("positionY")[0];
          const x = parseFloat(positionXNode.textContent!);
          const y = parseFloat(positionYNode.textContent!);
          const serialNode =
            droneNodes[i].getElementsByTagName("serialNumber")[0];
          const serial = serialNode.textContent;
          drones.push({ position: [x, y], serial: serial! });
        }

        // Calculate distance from each drone to the center of the no-fly zone
        const noFlyZoneCenter = [250000, 250000];
        const noFlyZoneRadius = 100000;
        const pilotsInViolation: Pilot[] = [];

        for (const drone of drones) {
          const xDiff = drone.position[0] - noFlyZoneCenter[0];
          const yDiff = drone.position[1] - noFlyZoneCenter[1];
          const distance = Math.sqrt(xDiff ** 2 + yDiff ** 2);

          if (distance <= noFlyZoneRadius) {
            console.log(`Drone ${drone.serial} is in the no-fly zone.`);
          } else {
            console.log(`Drone ${drone.serial} is outside the no-fly zone.`);
          }

          if (distance <= noFlyZoneRadius) {
            // Fetch pilot information
            const pilotData = await fetch(
              `https://assignments.reaktor.com/birdnest/pilots/${drone.serial}`
            );

            console.log(pilotData);

            if (!pilotData.ok) {
              throw new Error("Pilot information not found");
            }
            const pilotJSON = await pilotData.json();
            pilotsInViolation.push({
              firstName: pilotJSON.firstName,
              lastName: pilotJSON.lastName,
              phoneNumber: pilotJSON.phoneNumber,
              email: pilotJSON.email,
              pilotId: pilotJSON.pilotId,
              createdDt: pilotJSON.createdDt,
              distance,
            });
          }
        }
        return pilotsInViolation;
      } catch (error) {
        console.error(error);
      }
    };
    const interval = setInterval(() => {
      getData().then((pilots) => setPilots((prev) => [...prev, ...pilots!]));
    }, 2000);
    return () => clearInterval(interval);
    // setTimeout(getData, 600000);
  }, []);
  return (
    <div>
      <h2>Pilots in Violation</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Distance to Nest</th>
          </tr>
        </thead>
        <tbody>
          {pilots.map((pilot, index) => (
            <tr key={index}>
              <td>{pilot.firstName + " " + pilot.lastName}</td>
              <td>{pilot.email}</td>
              <td>{pilot.phoneNumber}</td>
              <td>{pilot.distance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PilotsList;
