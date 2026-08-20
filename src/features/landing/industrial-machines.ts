import machine1Img from "@/assets/machine1.webp";
import machine2Img from "@/assets/machine2.webp";
import machine3Img from "@/assets/machine3.webp";
import machine1Card from "@/assets/machines/machine1-card.webp";
import machine2Card from "@/assets/machines/machine2-card.webp";
import machine3Card from "@/assets/machines/machine3-card.webp";

export const INDUSTRIAL_MACHINES = [
  {
    id: "vectrostim-100",
    name: "VECTROSTIM-100 Electrotherapy Unit",
    shortName: "VECTROSTIM-100",
    role: "Stimulation and electrotherapy in physiotherapy settings",
    image: machine1Img,
    cardImage: machine1Card,
    usage:
      "Place the unit on a stable, flat surface with controls within comfortable reach. Understand the selected stimulation mode and set parameters to the prescribed protocol. Connect and position patient leads and electrodes correctly before starting treatment, and avoid reaching across the machine while operating it.",
    posture:
      "Keep a neutral spine, relaxed shoulders and an upright head position. Position the unit around waist-to-elbow height so the display and controls can be used without repeatedly bending the neck or back.",
    method:
      "Keep the machine, treatment bed and frequently used accessories inside the normal working area. Move closer to the equipment or reposition the trolley instead of bending or twisting. Adjust bed height where possible to reduce prolonged forward bending.",
    assessment: [
      "Neck — avoid prolonged downward bending while viewing the display",
      "Shoulders — keep relaxed, not raised or over-reaching",
      "Back — maintain a neutral position and minimize forward bending",
      "Elbows — keep close to the body while adjusting controls",
      "Wrists — keep straight and neutral on buttons and knobs",
      "Legs and feet — stable support when standing; feet supported when seated",
    ],
    recommendation:
      "Position the electrotherapy unit and patient at a comfortable working height to minimize bending, reaching and twisting, while maintaining a neutral body posture throughout operation.",
  },
  {
    id: "cpm",
    name: "Continuous Passive Motion (CPM) Apparatus",
    shortName: "CPM Apparatus",
    role: "Controlled joint movement — commonly the knee — without active muscular effort",
    image: machine2Img,
    cardImage: machine2Card,
    usage:
      "Position the patient's leg securely in the apparatus, with the knee aligned to the machine's movement axis. Straps should hold the limb comfortably without excessive pressure. Range of motion and speed follow the prescribed rehabilitation plan and must be supervised by a trained professional.",
    posture:
      "The patient remains comfortably supported in a lying or semi-reclined position, with hip, knee and ankle aligned. The physiotherapist should access controls from a comfortable standing or seated position rather than repeatedly bending over the machine.",
    method:
      "Arrange the CPM unit and treatment bed so straps, supports and controls can be adjusted without excessive bending, twisting or reaching. Make setup adjustments before treatment begins, and keep cables clear of walking areas.",
    assessment: [
      "Patient — hip, knee and ankle alignment should stay natural and supported",
      "Knee — must correspond with the CPM pivot / movement point",
      "Back and pelvis — supported, without unwanted rotation",
      "Therapist's back — avoid prolonged forward bending during setup",
      "Shoulders and arms — relaxed, without excessive reaching",
      "Environment — adequate clearance and safely managed power cables",
    ],
    recommendation:
      "Ensure correct joint alignment, secure comfortable positioning, appropriate machine settings, and an ergonomic working height to deliver controlled CPM therapy while minimizing strain on both patient and physiotherapist.",
  },
  {
    id: "nova-trac",
    name: "IMS NOVA TRAC Traction Therapy Machine",
    shortName: "IMS NOVA TRAC",
    role: "Controlled cervical (neck) and lumbar (lower-back) traction",
    image: machine3Img,
    cardImage: machine3Card,
    usage:
      "Position the patient securely on the treatment bed with the appropriate cervical or lumbar setup. A qualified clinician selects traction tension, treatment time, hold time and rest time according to the prescribed plan.",
    posture:
      "The patient remains supported with the spine aligned and without unnecessary twisting. For lumbar traction, pelvis and trunk are secured; for cervical traction, head and neck stay aligned and supported. The therapist operates controls with an upright posture, relaxed shoulders and a neutral neck.",
    method:
      "Work close to the patient instead of reaching across the bed. Adjust the bed to a comfortable height, avoid prolonged forward bending and trunk twisting, use both hands for heavier components, and keep cables and traction cords organised away from walking areas.",
    assessment: [
      "Patient — head, neck, spine, pelvis and legs aligned before treatment",
      "Therapist neck — avoid repeated downward bending",
      "Shoulders — not elevated while reaching for straps or controls",
      "Trunk — minimize forward bending and twisting during setup",
      "Space — adequate clearance to move safely around the treatment bed",
    ],
    recommendation:
      "Maintain correct spinal alignment, secure patient positioning and an ergonomic working height. Minimize bending, twisting and excessive reaching during setup and operation.",
  },
] as const;

export type IndustrialMachine = (typeof INDUSTRIAL_MACHINES)[number];
export type IndustrialMachineId = IndustrialMachine["id"];

export function getIndustrialMachine(id: string): IndustrialMachine | undefined {
  return INDUSTRIAL_MACHINES.find((machine) => machine.id === id);
}
