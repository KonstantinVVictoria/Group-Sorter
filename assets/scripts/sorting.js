const data = ``;
//data prep
let data_entries = {};
let preference_groups = {};

data.split("\n").forEach((line, i) => {
  if (!i) return;
  let entry = line.split(",");
  let user_properties = {
    name: entry[1],
    contact: entry[2],
    number: entry[3],
    aptitude: entry[4],
    preferences: entry.slice(5),
  };

  split_by_name(entry, user_properties);
  split_by_preferences(entry, user_properties);
});

export let preferences = preference_groups;
export function start_sort(threshold, preference) {
  let set_of_people = [];
  let group = [];
  let num_of_people = 0;
  let total_aptitude = 0;
  let unsorted_groups = [];
  let execute_start_time = new Date().getTime();
  let preference_name = Object.keys(preference_groups)[preference];
  Object.values(Object.entries(preference_groups)[preference][1]).forEach(
    (person) => {
      if (group.length == 4) {
        unsorted_groups.push(group);
        group = [];
      }
      group.push(person);
      set_of_people.push(person);
      num_of_people++;
      total_aptitude += parseInt(person.aptitude);
    }
  );
  let standard_deviation = 0;
  const average_aptitude = total_aptitude / num_of_people;
  //data prep end

  //sort begin
  let sort_report = "";
  unsorted_groups = groupings_objectify(unsorted_groups, average_aptitude);
  let sorted_groups_deviation = -1;
  //let threshold = 1;

  //  new Date().getTime() - execute_start_time <= 4000
  let sorted_groups = {};
  for (
    let k = 0;
    sorted_groups_deviation === -1 || sorted_groups_deviation > threshold;
    k++
  ) {
    let sorted_people = set_of_people;
    if (k != 0) {
      sorted_people = sort(set_of_people);
    }
    for (let i = 0; i < k; i++) {
      sorted_people = sort(sorted_people);
      if (new Date().getTime() - execute_start_time > 4000) {
        return {
          is_successful: 0,
          payload: {
            data: "Timed Out. Try matching the last standard deviation",
            standard_deviation: sorted_groups_deviation,
          },
        };
      }
    }

    let groupings_sorted = split_into_groups_of(4, sorted_people);
    sorted_groups = groupings_objectify(groupings_sorted, average_aptitude);
    sorted_groups.aptitude_vector.forEach(
      (element, i) =>
        (sort_report +=
          `"${element}"` +
          (i !== sorted_groups.aptitude_vector.length - 1 ? "," : ""))
    );
    sort_report += "\n";
    let sorted_groups_average_aptitude =
      sorted_groups.aptitude_vector.reduce((partial_sum, a) => {
        return partial_sum + a;
      }, 0) / sorted_groups.aptitude_vector.length;

    sorted_groups_deviation = Math.sqrt(
      sorted_groups.aptitude_vector.reduce((partial_sum, a) => {
        return partial_sum + Math.pow(a - sorted_groups_average_aptitude, 2);
      }, 0) / sorted_groups.aptitude_vector.length
    );
    if (k == 0) {
      shuffle_array(sorted_people);
    }
  }
  let group_listing = {};
  group_listing[preference_name] = {};
  sorted_groups.vector.forEach((group, i) => {
    group_listing[preference_name][`Group ${i + 1}`] = [];
    group_listing[preference_name][`Group ${i + 1}`] = group.map((person) => {
      return [person.name, person.aptitude];
    });
  });
  return {
    is_successful: 1,
    payload: {
      data: group_listing,
      standard_deviation: sorted_groups_deviation,
    },
  };
}
//sort end

//functions
function split_by_name(entry, user_properties) {
  data_entries[entry[1]] = user_properties;
}

function split_by_preferences(entry, user_properties) {
  for (let i = 5; i <= 7; i++) {
    if (!preference_groups[entry[i]]) {
      preference_groups[entry[i]] = {};
    }
    preference_groups[entry[i]][entry[1] ? entry[1] : entry[2]] =
      user_properties;
  }
}

function shuffle_array(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
function split_into_groups_of(number_of_people, array) {
  let groupings_sorted = [];
  let group = [];
  for (let i = 0; i < array.length; i++) {
    group.push(array[i]);
    if (group.length == number_of_people) {
      groupings_sorted.push(group);
      group = [];
    }
  }
  if (group.length != 4) {
    groupings_sorted.push(group);
  }

  return groupings_sorted;
}

function deep_sort(array) {
  let half_index = Math.ceil(array.length / 2);
  let left_half_of_array = array.slice(0, half_index);
  let right_half_of_array = array.slice(-half_index);
  if (left_half_of_array.length > 2) {
    left_half_of_array = deep_sort(left_half_of_array);
  }
  if (right_half_of_array.length > 2) {
    right_half_of_array = deep_sort(right_half_of_array);
  }
  let left_half_total_aptitude = left_half_of_array.reduce(
    (partialSum, { aptitude }) => partialSum + parseInt(aptitude),
    0
  );
  let right_half_total_aptitude = right_half_of_array.reduce(
    (partialSum, { aptitude }) => partialSum + parseInt(aptitude),
    0
  );
  for (let i = 0; i < right_half_of_array.length - i - 1; i++) {
    if (
      exchange_rule(
        left_half_of_array[i],
        right_half_of_array[right_half_of_array.length - i - 1]
      )
    ) {
      let middle_man = left_half_of_array[i];
      left_half_of_array[i] =
        right_half_of_array[right_half_of_array.length - i - 1];
      right_half_of_array[right_half_of_array.length - i - 1] = middle_man;
    }
  }

  function exchange_rule(agent_left, agent_right) {
    const leeway = 20;
    let net_agent_aptitude = agent_right.aptitude - agent_left.aptitude;
    let net_group_aptitude =
      right_half_total_aptitude - left_half_total_aptitude;
    let trade_net_group_aptitude =
      left_half_total_aptitude +
      net_agent_aptitude -
      (left_half_total_aptitude - net_agent_aptitude);

    if (Math.abs(net_group_aptitude) > Math.abs(trade_net_group_aptitude))
      return true;
    return false;
  }
  return left_half_of_array.concat(right_half_of_array);
  //console.log(left_half_of_array.length, right_half_of_array.length);
}

function sort(array) {
  return [...new Set(deep_sort(array))];
}

function groupings_objectify(vector, average_aptitude) {
  function group_aptitude_vector(groupings) {
    return groupings.map((group) => {
      let group_aptitude = 0;
      group.forEach((person) => {
        group_aptitude += parseInt(person.aptitude);
      });
      return group_aptitude;
    });
  }
  function group_aptitude_greediness_vector(group_vector, average_aptitude) {
    return group_vector.map((total_aptitude) => {
      return total_aptitude - average_aptitude;
    });
  }
  let aptitude_vector = group_aptitude_vector(vector);
  let aptitude_greediness_vector = group_aptitude_greediness_vector(
    aptitude_vector,
    average_aptitude
  );
  let vector_object = {
    vector: vector,
    aptitude_vector: aptitude_vector,
    aptitude_greediness_vector: aptitude_greediness_vector,
  };
  return vector_object;
}

// console.log(average_aptitude);
// console.log(group_aptitude_greediness_vector);
